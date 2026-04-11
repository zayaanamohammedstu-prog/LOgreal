from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db, limiter
from ..models.user import User, UserRole
from ..models.audit_log import AuditLog
from ..models.registration_request import RegistrationRequest, RegistrationStatus
from ..services.audit_service import log_action
from ..services.email_service import send_approval_email
from ..utils.decorators import min_role_required
from ..services.auth_service import _create_user_from_request

admin_bp = Blueprint("admin", __name__)


def _json_body() -> dict:
    return request.get_json(silent=True) or {}


def _require_min_role(min_role: UserRole):
    """Inline role check returning (user, error_response|None)."""
    from flask_jwt_extended import verify_jwt_in_request
    verify_jwt_in_request()
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or not user.is_active or not user.is_approved:
        return None, (jsonify({"error": "Access denied."}), 403)
    role_rank = {UserRole.viewer: 1, UserRole.auditor: 2, UserRole.admin: 3, UserRole.superadmin: 4}
    if role_rank.get(user.role, 0) < role_rank.get(min_role, 0):
        return None, (jsonify({"error": "Insufficient permissions."}), 403)
    return user, None


# ── Registrations ──────────────────────────────────────────────────────────────

@admin_bp.get("/registrations")
@jwt_required()
def list_registrations():
    current_user, err = _require_min_role(UserRole.admin)
    if err:
        return err

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status_filter = request.args.get("status", "pending")

    query = RegistrationRequest.query
    if status_filter:
        try:
            query = query.filter_by(status=RegistrationStatus(status_filter))
        except ValueError:
            pass

    paginated = query.order_by(RegistrationRequest.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "registrations": [r.to_dict() for r in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page": page,
    }), 200


@admin_bp.post("/registrations/<int:reg_id>/approve")
@jwt_required()
def approve_registration(reg_id: int):
    current_user, err = _require_min_role(UserRole.admin)
    if err:
        return err

    reg = RegistrationRequest.query.get_or_404(reg_id)
    if reg.status != RegistrationStatus.pending:
        return jsonify({"error": "Registration is not in pending state."}), 409

    data = _json_body()
    reg.status = RegistrationStatus.approved
    reg.reviewed_by = current_user.id
    reg.review_note = data.get("note")
    reg.reviewed_at = datetime.now(timezone.utc)

    user = _create_user_from_request(reg)
    db.session.commit()

    send_approval_email(reg.email, reg.username, approved=True, note=reg.review_note)
    log_action("registration_approved", user_id=current_user.id, resource="registration",
               resource_id=reg_id, details={"email": reg.email})
    return jsonify({"message": "Registration approved.", "user": user.to_dict()}), 200


@admin_bp.post("/registrations/<int:reg_id>/reject")
@jwt_required()
def reject_registration(reg_id: int):
    current_user, err = _require_min_role(UserRole.admin)
    if err:
        return err

    reg = RegistrationRequest.query.get_or_404(reg_id)
    if reg.status != RegistrationStatus.pending:
        return jsonify({"error": "Registration is not in pending state."}), 409

    data = _json_body()
    reg.status = RegistrationStatus.rejected
    reg.reviewed_by = current_user.id
    reg.review_note = data.get("note")
    reg.reviewed_at = datetime.now(timezone.utc)
    db.session.commit()

    send_approval_email(reg.email, reg.username, approved=False, note=reg.review_note)
    log_action("registration_rejected", user_id=current_user.id, resource="registration",
               resource_id=reg_id, details={"email": reg.email})
    return jsonify({"message": "Registration rejected."}), 200


# ── Users ──────────────────────────────────────────────────────────────────────

@admin_bp.get("/users")
@jwt_required()
def list_users():
    current_user, err = _require_min_role(UserRole.admin)
    if err:
        return err

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    role_filter = request.args.get("role")
    search = request.args.get("search")

    query = User.query
    if role_filter:
        try:
            query = query.filter_by(role=UserRole(role_filter))
        except ValueError:
            pass
    if search:
        query = query.filter(
            db.or_(
                User.username.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )

    paginated = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "users": [u.to_dict() for u in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page": page,
    }), 200


@admin_bp.put("/users/<int:user_id>")
@jwt_required()
def update_user(user_id: int):
    current_user, err = _require_min_role(UserRole.admin)
    if err:
        return err

    user = User.query.get_or_404(user_id)
    data = _json_body()

    # Superadmin-only: role changes
    if "role" in data:
        role_rank = {UserRole.viewer: 1, UserRole.auditor: 2, UserRole.admin: 3, UserRole.superadmin: 4}
        if role_rank.get(current_user.role, 0) < role_rank.get(UserRole.superadmin, 0):
            return jsonify({"error": "Only superadmin can change roles."}), 403
        try:
            user.role = UserRole(data["role"])
        except ValueError:
            return jsonify({"error": "Invalid role."}), 400

    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    if "is_approved" in data:
        user.is_approved = bool(data["is_approved"])

    db.session.commit()
    log_action("user_updated", user_id=current_user.id, resource="user", resource_id=user_id,
               details=data)
    return jsonify({"message": "User updated.", "user": user.to_dict()}), 200


@admin_bp.delete("/users/<int:user_id>")
@jwt_required()
def deactivate_user(user_id: int):
    current_user, err = _require_min_role(UserRole.admin)
    if err:
        return err

    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        return jsonify({"error": "You cannot deactivate your own account."}), 400

    user.is_active = False
    db.session.commit()
    log_action("user_deactivated", user_id=current_user.id, resource="user", resource_id=user_id)
    return jsonify({"message": "User deactivated."}), 200


# ── Audit Logs ─────────────────────────────────────────────────────────────────

@admin_bp.get("/audit-logs")
@jwt_required()
def get_audit_logs():
    current_user, err = _require_min_role(UserRole.auditor)
    if err:
        return err

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    query = AuditLog.query
    if request.args.get("user_id"):
        query = query.filter_by(user_id=int(request.args["user_id"]))
    if request.args.get("action"):
        query = query.filter(AuditLog.action.ilike(f"%{request.args['action']}%"))
    if request.args.get("status"):
        from ..models.audit_log import LogStatus
        try:
            query = query.filter_by(status=LogStatus(request.args["status"]))
        except ValueError:
            pass
    if request.args.get("start_date"):
        query = query.filter(AuditLog.timestamp >= request.args["start_date"])
    if request.args.get("end_date"):
        query = query.filter(AuditLog.timestamp <= request.args["end_date"])

    paginated = query.order_by(AuditLog.timestamp.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "logs": [log.to_dict() for log in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page": page,
    }), 200


# ── System Stats ───────────────────────────────────────────────────────────────

@admin_bp.get("/system-stats")
@jwt_required()
def system_stats():
    current_user, err = _require_min_role(UserRole.admin)
    if err:
        return err

    from sqlalchemy import func
    from ..models.registration_request import RegistrationRequest

    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    pending_registrations = RegistrationRequest.query.filter_by(
        status=RegistrationStatus.pending
    ).count()
    total_logs = AuditLog.query.count()

    users_by_role = {
        r.value: User.query.filter_by(role=r).count() for r in UserRole
    }

    recent_logins = AuditLog.query.filter(
        AuditLog.action.in_(["login_success", "login_success_mfa"])
    ).order_by(AuditLog.timestamp.desc()).limit(10).all()

    return jsonify({
        "total_users": total_users,
        "active_users": active_users,
        "pending_registrations": pending_registrations,
        "total_audit_logs": total_logs,
        "users_by_role": users_by_role,
        "recent_logins": [log.to_dict() for log in recent_logins],
    }), 200
