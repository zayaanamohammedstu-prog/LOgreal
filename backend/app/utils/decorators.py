from functools import wraps
from flask import request, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..models.user import User, UserRole
from ..services.audit_service import log_action


ROLE_HIERARCHY = {
    UserRole.viewer: 1,
    UserRole.auditor: 2,
    UserRole.admin: 3,
    UserRole.superadmin: 4,
}


def role_required(*roles: UserRole):
    """Decorator: require the current user to have one of the specified roles."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            user = User.query.get(identity)

            if not user or not user.is_active or not user.is_approved:
                return {"error": "Access denied. Account inactive or not approved."}, 403

            if user.role not in roles:
                return {"error": "Insufficient permissions."}, 403

            g.current_user = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def min_role_required(min_role: UserRole):
    """Decorator: require the user to have at least the given role level."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            user = User.query.get(identity)

            if not user or not user.is_active or not user.is_approved:
                return {"error": "Access denied. Account inactive or not approved."}, 403

            if ROLE_HIERARCHY.get(user.role, 0) < ROLE_HIERARCHY.get(min_role, 0):
                return {"error": "Insufficient permissions."}, 403

            g.current_user = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def audit_log_action(action: str, resource: str = None):
    """Decorator: automatically write an audit log entry after the endpoint executes."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            response = fn(*args, **kwargs)
            status_code = response[1] if isinstance(response, tuple) else 200
            status = "success" if status_code < 400 else "failure"

            user_id = None
            try:
                verify_jwt_in_request(optional=True)
                identity = get_jwt_identity()
                if identity:
                    user_id = int(identity)
            except Exception:
                pass

            log_action(
                action=action,
                resource=resource,
                user_id=user_id,
                status=status,
                ip_address=request.remote_addr,
                user_agent=request.headers.get("User-Agent"),
            )
            return response

        return wrapper

    return decorator
