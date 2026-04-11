import os
from flask import current_app
from ..models.user import UserRole

# Role hierarchy: higher value = more permissions
ROLE_RANK: dict[UserRole, int] = {
    UserRole.viewer: 1,
    UserRole.auditor: 2,
    UserRole.admin: 3,
    UserRole.superadmin: 4,
}


def has_min_role(user_role: UserRole, min_role: UserRole) -> bool:
    return ROLE_RANK.get(user_role, 0) >= ROLE_RANK.get(min_role, 0)


def confine_to_reports_dir(file_path: str) -> str:
    """
    Resolve *file_path* and verify it sits within the configured reports
    directory.  Returns the resolved absolute path on success.
    Raises ValueError if the path escapes the reports directory.
    """
    reports_dir = os.path.realpath(current_app.config.get("REPORTS_DIR", "reports"))
    resolved = os.path.realpath(file_path)
    if not resolved.startswith(reports_dir + os.sep):
        raise ValueError("File path is outside the reports directory.")
    return resolved
