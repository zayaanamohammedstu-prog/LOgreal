from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models.user import User, UserRole
from ..models.audit_log import AuditLog, LogStatus
from ..models.registration_request import RegistrationRequest, RegistrationStatus
from ..models.report import Report

dashboard_bp = Blueprint("dashboard", __name__)


def _get_current_user() -> tuple[User | None, tuple | None]:
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or not user.is_active or not user.is_approved:
        return None, (jsonify({"error": "Access denied."}), 403)
    return user, None


# ── Viewer ─────────────────────────────────────────────────────────────────────

@dashboard_bp.get("/viewer")
@jwt_required()
def viewer_dashboard():
    user, err = _get_current_user()
    if err:
        return err

    recent_logs = (
        AuditLog.query
        .filter_by(user_id=user.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(10)
        .all()
    )
    return jsonify({
        "user": user.to_dict(),
        "recent_activity": [log.to_dict() for log in recent_logs],
    }), 200


# ── Auditor ────────────────────────────────────────────────────────────────────

@dashboard_bp.get("/auditor")
@jwt_required()
def auditor_dashboard():
    user, err = _get_current_user()
    if err:
        return err

    role_rank = {UserRole.viewer: 1, UserRole.auditor: 2, UserRole.admin: 3, UserRole.superadmin: 4}
    if role_rank.get(user.role, 0) < role_rank[UserRole.auditor]:
        return jsonify({"error": "Insufficient permissions."}), 403

    total_logs = AuditLog.query.count()
    failed_events = AuditLog.query.filter_by(status=LogStatus.failure).count()
    recent_logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(20).all()

    # Action breakdown
    from sqlalchemy import func
    from ..extensions import db
    action_counts = (
        db.session.query(AuditLog.action, func.count(AuditLog.id))
        .group_by(AuditLog.action)
        .order_by(func.count(AuditLog.id).desc())
        .limit(10)
        .all()
    )

    return jsonify({
        "user": user.to_dict(),
        "total_logs": total_logs,
        "failed_events": failed_events,
        "recent_logs": [log.to_dict() for log in recent_logs],
        "top_actions": [{"action": a, "count": c} for a, c in action_counts],
    }), 200


# ── Admin ──────────────────────────────────────────────────────────────────────

@dashboard_bp.get("/admin")
@jwt_required()
def admin_dashboard():
    user, err = _get_current_user()
    if err:
        return err

    role_rank = {UserRole.viewer: 1, UserRole.auditor: 2, UserRole.admin: 3, UserRole.superadmin: 4}
    if role_rank.get(user.role, 0) < role_rank[UserRole.admin]:
        return jsonify({"error": "Insufficient permissions."}), 403

    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    pending_regs = RegistrationRequest.query.filter_by(status=RegistrationStatus.pending).count()
    total_reports = Report.query.count()

    users_by_role = {r.value: User.query.filter_by(role=r).count() for r in UserRole}

    return jsonify({
        "user": user.to_dict(),
        "stats": {
            "total_users": total_users,
            "active_users": active_users,
            "pending_registrations": pending_regs,
            "total_reports": total_reports,
            "users_by_role": users_by_role,
        },
    }), 200


# ── Superadmin ─────────────────────────────────────────────────────────────────

@dashboard_bp.get("/superadmin")
@jwt_required()
def superadmin_dashboard():
    user, err = _get_current_user()
    if err:
        return err

    if user.role != UserRole.superadmin:
        return jsonify({"error": "Superadmin access required."}), 403

    from ..extensions import db
    from sqlalchemy import func

    total_users = User.query.count()
    locked_accounts = User.query.filter(User.locked_until.isnot(None)).count()
    totp_enabled_count = User.query.filter_by(totp_enabled=True).count()

    # Logins per day (last 7 days)
    login_trend = (
        db.session.query(
            func.date(AuditLog.timestamp).label("date"),
            func.count(AuditLog.id).label("count"),
        )
        .filter(AuditLog.action.in_(["login_success", "login_success_mfa"]))
        .group_by(func.date(AuditLog.timestamp))
        .order_by(func.date(AuditLog.timestamp).desc())
        .limit(7)
        .all()
    )

    return jsonify({
        "user": user.to_dict(),
        "stats": {
            "total_users": total_users,
            "locked_accounts": locked_accounts,
            "totp_enabled_users": totp_enabled_count,
            "users_by_role": {r.value: User.query.filter_by(role=r).count() for r in UserRole},
        },
        "login_trend": [{"date": str(d), "count": c} for d, c in login_trend],
    }), 200
