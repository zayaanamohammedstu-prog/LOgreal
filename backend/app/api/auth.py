from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    create_refresh_token,
    create_access_token,
    get_jwt,
)
from ..extensions import limiter
from ..models.user import User
from ..services import auth_service
from ..services.audit_service import log_action

auth_bp = Blueprint("auth", __name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _json_body() -> dict:
    return request.get_json(silent=True) or {}


def _ip() -> str:
    return request.headers.get("X-Forwarded-For", request.remote_addr)


# ── Registration ───────────────────────────────────────────────────────────────

@auth_bp.post("/register")
@limiter.limit("10 per hour")
def register():
    """Step 1: Collect registration info and send OTP."""
    data = _json_body()
    result, status = auth_service.initiate_registration(data)
    return jsonify(result), status


@auth_bp.post("/verify-otp")
@limiter.limit("10 per hour")
def verify_otp():
    """Step 2: Verify OTP and finalize registration."""
    data = _json_body()
    result, status = auth_service.verify_registration_otp(data)
    return jsonify(result), status


# ── Login ──────────────────────────────────────────────────────────────────────

@auth_bp.post("/login")
@limiter.limit("20 per hour")
def login():
    """Login with email + password. Returns JWT or triggers MFA."""
    data = _json_body()
    result, status = auth_service.authenticate_user(data)
    return jsonify(result), status


@auth_bp.post("/login/mfa")
@jwt_required()
@limiter.limit("20 per hour")
def login_mfa():
    """Complete MFA login with TOTP code."""
    user_id = int(get_jwt_identity())
    data = _json_body()
    result, status = auth_service.verify_mfa(data, user_id)
    return jsonify(result), status


# ── Session ────────────────────────────────────────────────────────────────────

@auth_bp.post("/logout")
@jwt_required(optional=True)
def logout():
    user_id = get_jwt_identity()
    if user_id:
        log_action("logout", user_id=int(user_id), ip_address=_ip())
    # Client must discard tokens; server-side blocklist can be added here
    return jsonify({"message": "Logged out successfully."}), 200


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({"access_token": access_token}), 200


# ── Password reset ─────────────────────────────────────────────────────────────

@auth_bp.post("/forgot-password")
@limiter.limit("5 per hour")
def forgot_password():
    data = _json_body()
    result, status = auth_service.initiate_password_reset(data)
    return jsonify(result), status


@auth_bp.post("/reset-password")
@limiter.limit("5 per hour")
def reset_password():
    data = _json_body()
    result, status = auth_service.reset_password(data)
    return jsonify(result), status


# ── Current user ───────────────────────────────────────────────────────────────

@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({"user": user.to_dict()}), 200


# ── TOTP setup ─────────────────────────────────────────────────────────────────

@auth_bp.post("/setup-totp")
@jwt_required()
def setup_totp():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    result, status = auth_service.setup_totp(user)
    return jsonify(result), status


@auth_bp.post("/confirm-totp")
@jwt_required()
def confirm_totp():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = _json_body()
    result, status = auth_service.confirm_totp(user, data)
    return jsonify(result), status


# ── Account change ─────────────────────────────────────────────────────────────

@auth_bp.post("/request-account-change")
@jwt_required()
@limiter.limit("5 per hour")
def request_account_change():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    result, status = auth_service.request_account_change(user)
    return jsonify(result), status


@auth_bp.put("/update-account")
@jwt_required()
def update_account():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = _json_body()
    result, status = auth_service.update_account(user, data)
    return jsonify(result), status
