import re
from email_validator import validate_email, EmailNotValidError


def validate_email_address(email: str) -> tuple[bool, str]:
    """Return (is_valid, normalised_email_or_error_message)."""
    try:
        info = validate_email(email, check_deliverability=False)
        return True, info.normalized
    except EmailNotValidError as exc:
        return False, str(exc)


def validate_username(username: str) -> tuple[bool, str]:
    """Usernames: 3-30 chars, alphanumeric + underscore/hyphen."""
    if not username:
        return False, "Username is required."
    if len(username) < 3:
        return False, "Username must be at least 3 characters."
    if len(username) > 30:
        return False, "Username must not exceed 30 characters."
    if not re.match(r"^[a-zA-Z0-9_\-]+$", username):
        return False, "Username may only contain letters, digits, underscores, and hyphens."
    return True, username


def validate_required_fields(data: dict, fields: list[str]) -> list[str]:
    """Return a list of missing field names."""
    return [f for f in fields if not data.get(f)]
