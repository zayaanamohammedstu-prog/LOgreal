from functools import wraps
from flask import request, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..models.user import User, UserRole
from ..services.audit_service import log_action
from .helpers import has_min_role


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

            if not has_min_role(user.role, min_role):
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
            # Safely extract status code — handle Response objects and variable-length tuples
            if isinstance(response, tuple) and len(response) >= 2 and isinstance(response[1], int):
                status_code = response[1]
            else:
                status_code = 200
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
