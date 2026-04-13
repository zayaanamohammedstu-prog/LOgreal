from datetime import datetime, timezone
from flask import current_app, request

from ..extensions import db
from ..models.user import User, UserRole
from ..models.otp import OTP, OTPType
from ..models.registration_request import RegistrationRequest, RegistrationStatus
from ..services.email_service import send_otp_email
from ..services.audit_service import log_action
from ..utils.password_policy import validate_password_strength
from ..utils.validators import validate_email_address, validate_username


# ── Registration ───────────────────────────────────────────────────────────────

def initiate_registration(data: dict) -> tuple[dict, int]:
    """Step 1: validate inputs, send OTP."""
    email = (data.get("email") or "").strip().lower()
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    role = (data.get("role") or "viewer").strip().lower()

    # Validate role
    valid_roles = [r.value for r in UserRole]
    if role not in valid_roles:
        return {"error": f"Invalid role. Must be one of {valid_roles}."}, 400

    # Validate email
    email_valid, email_or_error = validate_email_address(email)
    if not email_valid:
        return {"error": email_or_error}, 400

    # Validate username
    user_valid, username_or_error = validate_username(username)
    if not user_valid:
        return {"error": username_or_error}, 400

    # Validate password
    pw_errors = validate_password_strength(password)
    if pw_errors:
        return {"error": "Password does not meet requirements.", "details": pw_errors}, 400

    # Check existing user
    if User.query.filter_by(email=email_or_error).first():
        return {"error": "Email already registered."}, 409
    if User.query.filter_by(username=username).first():
        return {"error": "Username already taken."}, 409

    # Check pending registration
    existing = RegistrationRequest.query.filter_by(
        email=email_or_error, status=RegistrationStatus.pending
    ).first()
    if existing:
        return {"error": "A pending registration already exists for this email."}, 409

    expires_minutes = current_app.config.get("OTP_EXPIRES_MINUTES", 10)
    _, plain_code = OTP.generate_otp(email_or_error, OTPType.registration, expires_minutes)
    db.session.commit()

    send_otp_email(email_or_error, plain_code, "registration", expires_minutes)

    return {"message": "OTP sent to your email. Please verify to continue.", "email": email_or_error}, 200


def verify_registration_otp(data: dict) -> tuple[dict, int]:
    """Step 2: verify OTP and create the registration request."""
    email = (data.get("email") or "").strip().lower()
    code = (data.get("otp") or "").strip()
    password = data.get("password") or ""
    username = (data.get("username") or "").strip()
    role = (data.get("role") or "viewer").strip().lower()

    otp_record = (
        OTP.query
        .filter_by(email=email, otp_type=OTPType.registration, used=False)
        .order_by(OTP.created_at.desc())
        .first()
    )
    if not otp_record or not otp_record.verify_otp(code):
        log_action("registration_otp_verify", status="failure", details={"email": email})
        return {"error": "Invalid or expired OTP."}, 400

    otp_record.mark_used()

    # Create registration request
    reg = RegistrationRequest(
        email=email,
        username=username,
        role=role,
        otp_verified=True,
    )
    reg.set_password(password)

    # Viewers are auto-approved; others require admin review
    if role == UserRole.viewer.value:
        reg.status = RegistrationStatus.approved
        db.session.add(reg)
        db.session.flush()
        user = create_user_from_request(reg)
        db.session.commit()
        log_action("user_registered", resource="user", resource_id=user.id,
                   details={"email": email, "role": role})
        return {"message": "Registration successful. You can now log in.", "auto_approved": True}, 201
    else:
        reg.status = RegistrationStatus.pending
        db.session.add(reg)
        db.session.commit()
        log_action("registration_submitted", details={"email": email, "role": role})
        return {
            "message": "OTP verified. Your registration is pending admin approval.",
            "auto_approved": False,
        }, 201


def create_user_from_request(reg: RegistrationRequest) -> User:
    user = User(
        email=reg.email,
        username=reg.username,
        password_hash=reg.password_hash,
        role=UserRole(reg.role),
        is_active=True,
        is_approved=True,
    )
    db.session.add(user)
    return user


# ── Login ──────────────────────────────────────────────────────────────────────

def authenticate_user(data: dict) -> tuple[dict, int]:
    from flask_jwt_extended import create_access_token, create_refresh_token

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    max_attempts = current_app.config.get("MAX_FAILED_ATTEMPTS", 5)
    lockout_minutes = current_app.config.get("LOCKOUT_DURATION_MINUTES", 30)

    user = User.query.filter_by(email=email).first()

    if not user or not user.is_active:
        log_action("login_failed", status="failure", details={"email": email, "reason": "not_found"})
        return {"error": "Invalid credentials."}, 401

    if not user.is_approved:
        return {"error": "Your account is pending approval."}, 403

    if user.is_account_locked():
        db.session.commit()
        return {"error": "Account temporarily locked due to too many failed attempts."}, 423

    if not user.check_password(password):
        user.increment_failed_attempts(max_attempts, lockout_minutes)
        db.session.commit()
        log_action("login_failed", user_id=user.id, status="failure",
                   details={"reason": "wrong_password"})
        if user.is_account_locked():
            return {"error": "Too many failed attempts. Account locked for 30 minutes."}, 423
        remaining = max_attempts - user.failed_login_attempts
        return {"error": f"Invalid credentials. {remaining} attempt(s) remaining."}, 401

    user.reset_failed_attempts()
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    if user.totp_enabled:
        # Issue a short-lived pre-auth token
        pre_auth_token = create_access_token(
            identity=str(user.id), additional_claims={"mfa_pending": True}
        )
        log_action("login_mfa_required", user_id=user.id, resource="user")
        return {"mfa_required": True, "pre_auth_token": pre_auth_token}, 200

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    log_action("login_success", user_id=user.id, resource="user")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }, 200


def verify_mfa(data: dict, user_id: int) -> tuple[dict, int]:
    from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt

    totp_code = (data.get("totp_code") or "").strip()
    user = User.query.get(user_id)

    if not user:
        return {"error": "User not found."}, 404

    claims = get_jwt()
    if not claims.get("mfa_pending"):
        return {"error": "MFA step not required."}, 400

    if not user.verify_totp(totp_code):
        log_action("mfa_failed", user_id=user.id, status="failure")
        return {"error": "Invalid TOTP code."}, 401

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    log_action("login_success_mfa", user_id=user.id, resource="user")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }, 200


# ── Password reset ─────────────────────────────────────────────────────────────

def initiate_password_reset(data: dict) -> tuple[dict, int]:
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()

    # Always return 200 to avoid user enumeration
    if user and user.is_active:
        expires_minutes = current_app.config.get("OTP_EXPIRES_MINUTES", 10)
        _, plain_code = OTP.generate_otp(email, OTPType.password_reset, expires_minutes, user.id)
        db.session.commit()
        send_otp_email(email, plain_code, "password_reset", expires_minutes)

    return {"message": "If that email is registered, a reset code has been sent."}, 200


def reset_password(data: dict) -> tuple[dict, int]:
    email = (data.get("email") or "").strip().lower()
    code = (data.get("otp") or "").strip()
    new_password = data.get("new_password") or ""

    pw_errors = validate_password_strength(new_password)
    if pw_errors:
        return {"error": "Password does not meet requirements.", "details": pw_errors}, 400

    otp_record = (
        OTP.query
        .filter_by(email=email, otp_type=OTPType.password_reset, used=False)
        .order_by(OTP.created_at.desc())
        .first()
    )
    if not otp_record or not otp_record.verify_otp(code):
        return {"error": "Invalid or expired OTP."}, 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return {"error": "User not found."}, 404

    user.set_password(new_password)
    otp_record.mark_used()
    db.session.commit()
    log_action("password_reset", user_id=user.id, resource="user")
    return {"message": "Password reset successfully."}, 200


# ── TOTP setup ─────────────────────────────────────────────────────────────────

def setup_totp(user: User) -> tuple[dict, int]:
    import qrcode
    import base64
    from io import BytesIO

    user.generate_totp_secret()
    db.session.commit()

    uri = user.get_totp_uri()
    img = qrcode.make(uri)
    buf = BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    return {"qr_code": f"data:image/png;base64,{qr_b64}", "totp_uri": uri}, 200


def confirm_totp(user: User, data: dict) -> tuple[dict, int]:
    code = (data.get("totp_code") or "").strip()
    if not user.verify_totp(code):
        return {"error": "Invalid TOTP code. Please try again."}, 400

    user.totp_enabled = True
    db.session.commit()
    log_action("totp_enabled", user_id=user.id, resource="user")
    return {"message": "TOTP authentication enabled successfully."}, 200


# ── Account change ─────────────────────────────────────────────────────────────

def request_account_change(user: User) -> tuple[dict, int]:
    expires_minutes = current_app.config.get("OTP_EXPIRES_MINUTES", 10)
    _, plain_code = OTP.generate_otp(
        user.email, OTPType.account_change, expires_minutes, user.id
    )
    db.session.commit()
    send_otp_email(user.email, plain_code, "account_change", expires_minutes)
    return {"message": "OTP sent to your registered email."}, 200


def update_account(user: User, data: dict) -> tuple[dict, int]:
    code = (data.get("otp") or "").strip()

    otp_record = (
        OTP.query
        .filter_by(email=user.email, otp_type=OTPType.account_change, used=False)
        .order_by(OTP.created_at.desc())
        .first()
    )
    if not otp_record or not otp_record.verify_otp(code):
        return {"error": "Invalid or expired OTP."}, 400

    changes = {}
    if data.get("username"):
        new_username = data["username"].strip()
        valid, result = validate_username(new_username)
        if not valid:
            return {"error": result}, 400
        if User.query.filter(User.username == new_username, User.id != user.id).first():
            return {"error": "Username already taken."}, 409
        user.username = new_username
        changes["username"] = new_username

    if data.get("new_password"):
        pw_errors = validate_password_strength(data["new_password"])
        if pw_errors:
            return {"error": "Password does not meet requirements.", "details": pw_errors}, 400
        user.set_password(data["new_password"])
        changes["password"] = "updated"

    otp_record.mark_used()
    db.session.commit()
    log_action("account_updated", user_id=user.id, resource="user", details=changes)
    return {"message": "Account updated successfully.", "user": user.to_dict()}, 200
