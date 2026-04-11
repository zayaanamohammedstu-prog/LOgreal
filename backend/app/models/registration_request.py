import enum
from datetime import datetime, timezone
from ..extensions import db, bcrypt


class RegistrationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class RegistrationRequest(db.Model):
    __tablename__ = "registration_requests"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), nullable=False, default="viewer")
    status = db.Column(
        db.Enum(RegistrationStatus),
        nullable=False,
        default=RegistrationStatus.pending,
        index=True,
    )
    otp_verified = db.Column(db.Boolean, nullable=False, default=False)
    reviewed_by = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    review_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    reviewed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    reviewer = db.relationship("User", foreign_keys=[reviewed_by])

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "role": self.role,
            "status": self.status.value,
            "otp_verified": self.otp_verified,
            "review_note": self.review_note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "reviewed_by": self.reviewer.username if self.reviewer else None,
        }

    def __repr__(self) -> str:
        return f"<RegistrationRequest {self.email} ({self.status.value})>"
