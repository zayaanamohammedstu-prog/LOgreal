from flask import request
from ..extensions import db
from ..models.audit_log import AuditLog, LogStatus


def log_action(
    action: str,
    resource: str = None,
    resource_id: str = None,
    user_id: int = None,
    details: dict = None,
    status: str = "success",
    ip_address: str = None,
    user_agent: str = None,
    session_id: str = None,
) -> AuditLog:
    """Create an audit log entry and flush it to the session."""
    if ip_address is None:
        try:
            ip_address = request.remote_addr
        except RuntimeError:
            ip_address = None

    if user_agent is None:
        try:
            user_agent = request.headers.get("User-Agent")
        except RuntimeError:
            user_agent = None

    log_status = LogStatus.success if status == "success" else LogStatus.failure

    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=str(resource_id) if resource_id is not None else None,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        status=log_status,
        session_id=session_id,
    )
    db.session.add(entry)
    try:
        db.session.flush()
    except Exception:
        db.session.rollback()
        raise
    return entry
