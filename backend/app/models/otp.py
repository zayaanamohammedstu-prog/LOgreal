import enum
import random
import string
from datetime import datetime, timezone, timedelta
from ..extensions import db, bcrypt


class OTPType(str, enum.Enum):
    registration = "registration"
    login = "login"
    password_reset = "password_reset"
    account_change = "account_change"


class OTP(db.Model):
    __tablename__ = "otps"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    otp_hash = db.Column(db.String(255), nullable=False)
    otp_type = db.Column(db.Enum(OTPType), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    used = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    @staticmethod
    def generate_otp(
        email: str,
        otp_type: OTPType,
        expires_minutes: int = 10,
        user_id: int = None,
    ) -> tuple["OTP", str]:
        """Create and persist a new OTP.  Returns (otp_record, plain_code)."""
        # Invalidate all previous unused OTPs of the same type for this email
        OTP.query.filter_by(email=email, otp_type=otp_type, used=False).update({"used": True})

        plain_code = "".join(random.choices(string.digits, k=6))
        otp_hash = bcrypt.generate_password_hash(plain_code).decode("utf-8")

        record = OTP(
            user_id=user_id,
            email=email,
            otp_hash=otp_hash,
            otp_type=otp_type,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=expires_minutes),
        )
        db.session.add(record)
        db.session.flush()  # Get id without committing
        return record, plain_code

    def verify_otp(self, plain_code: str) -> bool:
        """Verify the plain code against the stored hash."""
        if self.used or self.is_expired():
            return False
        return bcrypt.check_password_hash(self.otp_hash, plain_code)

    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        exp = (
            self.expires_at.replace(tzinfo=timezone.utc)
            if self.expires_at.tzinfo is None
            else self.expires_at
        )
        return now >= exp

    def mark_used(self) -> None:
        self.used = True

    def __repr__(self) -> str:
        return f"<OTP {self.otp_type.value} for {self.email}>"
