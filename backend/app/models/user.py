import enum
from datetime import datetime, timezone
import pyotp
from ..extensions import db, bcrypt


class UserRole(str, enum.Enum):
    viewer = "viewer"
    auditor = "auditor"
    admin = "admin"
    superadmin = "superadmin"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.viewer)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_approved = db.Column(db.Boolean, nullable=False, default=False)
    avatar_url = db.Column(db.String(512), nullable=True)

    # TOTP
    totp_secret = db.Column(db.String(64), nullable=True)
    totp_enabled = db.Column(db.Boolean, nullable=False, default=False)

    # Account security
    failed_login_attempts = db.Column(db.Integer, nullable=False, default=0)
    locked_until = db.Column(db.DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    audit_logs = db.relationship("AuditLog", back_populates="user", lazy="dynamic")
    reports = db.relationship("Report", back_populates="generated_by_user", lazy="dynamic")

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, password)

    def generate_totp_secret(self) -> str:
        self.totp_secret = pyotp.random_base32()
        return self.totp_secret

    def get_totp_uri(self) -> str:
        if not self.totp_secret:
            self.generate_totp_secret()
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            name=self.email, issuer_name="LogGuard"
        )

    def verify_totp(self, token: str) -> bool:
        if not self.totp_secret:
            return False
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(token, valid_window=1)

    def is_account_locked(self) -> bool:
        if self.locked_until is None:
            return False
        now = datetime.now(timezone.utc)
        locked = self.locked_until.replace(tzinfo=timezone.utc) if self.locked_until.tzinfo is None else self.locked_until
        if now >= locked:
            self.locked_until = None
            self.failed_login_attempts = 0
            return False
        return True

    def lock_account(self, duration_minutes: int = 30) -> None:
        from datetime import timedelta
        self.locked_until = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)

    def increment_failed_attempts(self, max_attempts: int = 5, lockout_minutes: int = 30) -> None:
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= max_attempts:
            self.lock_account(lockout_minutes)

    def reset_failed_attempts(self) -> None:
        self.failed_login_attempts = 0
        self.locked_until = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "role": self.role.value,
            "is_active": self.is_active,
            "is_approved": self.is_approved,
            "totp_enabled": self.totp_enabled,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role.value})>"
