import re

MIN_LENGTH = 12
MAX_LENGTH = 128

_UPPER = re.compile(r"[A-Z]")
_LOWER = re.compile(r"[a-z]")
_DIGIT = re.compile(r"\d")
_SPECIAL = re.compile(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]")


def validate_password_strength(password: str) -> list[str]:
    """Return a list of violation messages (empty = valid)."""
    errors = []

    if len(password) < MIN_LENGTH:
        errors.append(f"Password must be at least {MIN_LENGTH} characters long.")

    if len(password) > MAX_LENGTH:
        errors.append(f"Password must not exceed {MAX_LENGTH} characters.")

    if not _UPPER.search(password):
        errors.append("Password must contain at least one uppercase letter.")

    if not _LOWER.search(password):
        errors.append("Password must contain at least one lowercase letter.")

    if not _DIGIT.search(password):
        errors.append("Password must contain at least one digit.")

    if not _SPECIAL.search(password):
        errors.append("Password must contain at least one special character.")

    return errors


def is_password_valid(password: str) -> bool:
    return len(validate_password_strength(password)) == 0
