import enum
from datetime import datetime, timezone
from ..extensions import db


class ReportFormat(str, enum.Enum):
    pdf = "pdf"
    excel = "excel"
    csv = "csv"


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    report_type = db.Column(db.String(64), nullable=False)
    generated_by = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    format = db.Column(db.Enum(ReportFormat), nullable=False)
    file_path = db.Column(db.String(512), nullable=True)
    parameters = db.Column(db.JSON, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    generated_by_user = db.relationship("User", back_populates="reports")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "report_type": self.report_type,
            "generated_by": self.generated_by_user.username if self.generated_by_user else None,
            "format": self.format.value,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<Report {self.title} ({self.format.value})>"
