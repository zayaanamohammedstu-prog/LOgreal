import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.user import User, UserRole
from ..models.report import Report
from ..services.report_service import generate_report
from ..services.email_service import send_report_email
from ..services.whatsapp_service import send_whatsapp_report
from ..services.audit_service import log_action

reports_bp = Blueprint("reports", __name__)


def _json_body() -> dict:
    return request.get_json(silent=True) or {}


def _get_current_user() -> tuple[User | None, tuple | None]:
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or not user.is_active or not user.is_approved:
        return None, (jsonify({"error": "Access denied."}), 403)
    return user, None


def _min_role_rank(user: User, min_role: UserRole) -> bool:
    role_rank = {UserRole.viewer: 1, UserRole.auditor: 2, UserRole.admin: 3, UserRole.superadmin: 4}
    return role_rank.get(user.role, 0) >= role_rank.get(min_role, 0)


# ── Generate ───────────────────────────────────────────────────────────────────

@reports_bp.post("/generate")
@jwt_required()
def generate():
    user, err = _get_current_user()
    if err:
        return err

    if not _min_role_rank(user, UserRole.auditor):
        return jsonify({"error": "Auditor role or higher required."}), 403

    data = _json_body()
    title = data.get("title") or "Untitled Report"
    report_type = data.get("report_type")
    fmt = (data.get("format") or "pdf").lower()
    parameters = data.get("parameters") or {}

    if not report_type:
        return jsonify({"error": "'report_type' is required. Valid: audit_logs, users"}), 400

    try:
        report = generate_report(
            title=title,
            report_type=report_type,
            fmt=fmt,
            generated_by_id=user.id,
            parameters=parameters,
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Report generation failed: {exc}"}), 500

    log_action("report_generated", user_id=user.id, resource="report",
               resource_id=report.id, details={"type": report_type, "format": fmt})
    return jsonify({"message": "Report generated.", "report": report.to_dict()}), 201


# ── List ───────────────────────────────────────────────────────────────────────

@reports_bp.get("")
@jwt_required()
def list_reports():
    user, err = _get_current_user()
    if err:
        return err

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    query = Report.query
    # Non-admin users only see their own reports
    if not _min_role_rank(user, UserRole.admin):
        query = query.filter_by(generated_by=user.id)

    paginated = query.order_by(Report.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "reports": [r.to_dict() for r in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page": page,
    }), 200


# ── Download ───────────────────────────────────────────────────────────────────

@reports_bp.get("/<int:report_id>/download")
@jwt_required()
def download_report(report_id: int):
    user, err = _get_current_user()
    if err:
        return err

    report = Report.query.get_or_404(report_id)

    # Users can only download their own reports unless admin+
    if report.generated_by != user.id and not _min_role_rank(user, UserRole.admin):
        return jsonify({"error": "Access denied."}), 403

    if not report.file_path or not os.path.exists(report.file_path):
        return jsonify({"error": "Report file not found."}), 404

    log_action("report_downloaded", user_id=user.id, resource="report", resource_id=report_id)
    return send_file(
        report.file_path,
        as_attachment=True,
        download_name=os.path.basename(report.file_path),
    )


# ── Send via email ─────────────────────────────────────────────────────────────

@reports_bp.post("/<int:report_id>/send-email")
@jwt_required()
def send_email(report_id: int):
    user, err = _get_current_user()
    if err:
        return err

    report = Report.query.get_or_404(report_id)
    if report.generated_by != user.id and not _min_role_rank(user, UserRole.admin):
        return jsonify({"error": "Access denied."}), 403

    data = _json_body()
    recipient = data.get("email") or user.email

    if not report.file_path or not os.path.exists(report.file_path):
        return jsonify({"error": "Report file not found."}), 404

    success = send_report_email(
        recipient=recipient,
        report_title=report.title,
        file_path=report.file_path,
        generated_at=report.created_at.isoformat() if report.created_at else "",
    )
    if success:
        log_action("report_emailed", user_id=user.id, resource="report",
                   resource_id=report_id, details={"recipient": recipient})
        return jsonify({"message": f"Report sent to {recipient}."}), 200
    return jsonify({"error": "Failed to send email. Check server logs."}), 500


# ── Send via WhatsApp ──────────────────────────────────────────────────────────

@reports_bp.post("/<int:report_id>/send-whatsapp")
@jwt_required()
def send_whatsapp(report_id: int):
    user, err = _get_current_user()
    if err:
        return err

    report = Report.query.get_or_404(report_id)
    if report.generated_by != user.id and not _min_role_rank(user, UserRole.admin):
        return jsonify({"error": "Access denied."}), 403

    data = _json_body()
    to_number = data.get("phone_number")
    if not to_number:
        return jsonify({"error": "'phone_number' is required."}), 400

    success, result = send_whatsapp_report(
        to_number=to_number,
        report_title=report.title,
        file_path=report.file_path,
    )
    if success:
        log_action("report_whatsapp_sent", user_id=user.id, resource="report",
                   resource_id=report_id, details={"to": to_number, "sid": result})
        return jsonify({"message": "Report sent via WhatsApp.", "sid": result}), 200
    return jsonify({"error": f"WhatsApp delivery failed: {result}"}), 500
