import os
import logging
from .celery_app import celery

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, to: str, subject: str, body: str, html_body: str = None):
    """Send an email asynchronously via Flask-Mail."""
    try:
        from app import create_app
        from app.extensions import mail
        from flask_mail import Message

        app = create_app()
        with app.app_context():
            msg = Message(subject=subject, recipients=[to], body=body, html=html_body)
            mail.send(msg)
            logger.info("Email sent to %s — subject: %s", to, subject)
            return {"status": "sent", "to": to, "subject": subject}
    except Exception as exc:
        logger.error("send_email_task failed for %s: %s", to, exc, exc_info=True)
        raise self.retry(exc=exc)


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def send_whatsapp_task(self, to: str, message: str, media_url: str = None):
    """Send a WhatsApp message asynchronously via Twilio."""
    try:
        from twilio.rest import Client
        account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        from_number = os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

        if not account_sid or not auth_token:
            raise ValueError("Twilio credentials not configured.")

        to_number = to if to.startswith("whatsapp:") else f"whatsapp:{to}"

        client = Client(account_sid, auth_token)
        msg_kwargs = {
            "from_": from_number,
            "to": to_number,
            "body": message,
        }
        if media_url:
            msg_kwargs["media_url"] = [media_url]

        result = client.messages.create(**msg_kwargs)
        logger.info("WhatsApp message sent to %s — SID: %s", to, result.sid)
        return {"status": "sent", "to": to, "sid": result.sid}
    except Exception as exc:
        logger.error("send_whatsapp_task failed for %s: %s", to, exc, exc_info=True)
        raise self.retry(exc=exc)


@celery.task(bind=True, max_retries=2, default_retry_delay=120)
def generate_report_task(
    self,
    report_id: int,
    report_type: str,
    format: str,
    user_id: int,
    parameters: dict,
):
    """Generate a report file and update the Report record with the file path."""
    try:
        from app import create_app
        from app.extensions import db
        from app.models.report import Report
        from app.services.report_service import generate_report

        app = create_app()
        with app.app_context():
            report_record = Report.query.get(report_id)
            if report_record is None:
                logger.error("generate_report_task: Report %d not found", report_id)
                return {"status": "error", "reason": "Report not found"}

            title = report_record.title
            report = generate_report(
                title=title,
                report_type=report_type,
                fmt=format,
                generated_by_id=user_id,
                parameters=parameters,
            )

            logger.info(
                "Report generated — id=%d type=%s format=%s",
                report.id, report_type, format,
            )
            return {
                "status": "done",
                "report_id": report.id,
                "file_path": report.file_path,
            }
    except Exception as exc:
        logger.error(
            "generate_report_task failed — report_id=%d: %s", report_id, exc, exc_info=True
        )
        raise self.retry(exc=exc)
