from flask import current_app, render_template_string
from flask_mail import Message
from ..extensions import mail


# ── Simple inline HTML templates ──────────────────────────────────────────────

OTP_TEMPLATE = """
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
  <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; padding: 32px;">
    <h2 style="color: #1a1a2e;">LogGuard Security Code</h2>
    <p>Hello,</p>
    <p>{{ message }}</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">
        {{ otp_code }}
      </span>
    </div>
    <p>This code expires in <strong>{{ expires_minutes }} minutes</strong>.</p>
    <p style="color: #888; font-size: 12px;">
      If you did not request this, please ignore this email.
    </p>
  </div>
</body>
</html>
"""

APPROVAL_TEMPLATE = """
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; padding: 32px;">
    <h2 style="color: #1a1a2e;">LogGuard — Account {{ status | title }}</h2>
    <p>Hello {{ username }},</p>
    <p>{{ body }}</p>
    {% if note %}
    <p><strong>Note from admin:</strong> {{ note }}</p>
    {% endif %}
    <p>You can log in at: <a href="{{ login_url }}">{{ login_url }}</a></p>
  </div>
</body>
</html>
"""

REPORT_TEMPLATE = """
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="max-width: 480px; margin: auto;">
    <h2>LogGuard Report</h2>
    <p>Please find your report <strong>{{ title }}</strong> attached.</p>
    <p>Generated on {{ generated_at }}</p>
  </div>
</body>
</html>
"""


def send_otp_email(
    recipient: str,
    otp_code: str,
    otp_type: str,
    expires_minutes: int = 10,
) -> bool:
    messages = {
        "registration": "Use the code below to verify your email and complete registration.",
        "login": "Use the code below to complete your login.",
        "password_reset": "Use the code below to reset your password.",
        "account_change": "Use the code below to confirm your account changes.",
    }
    body_message = messages.get(otp_type, "Use the code below.")

    html_body = render_template_string(
        OTP_TEMPLATE,
        otp_code=otp_code,
        message=body_message,
        expires_minutes=expires_minutes,
    )

    msg = Message(
        subject=f"LogGuard — Your verification code",
        recipients=[recipient],
        html=html_body,
    )
    try:
        mail.send(msg)
        return True
    except Exception as exc:
        current_app.logger.error(f"Failed to send OTP email to {recipient}: {exc}")
        return False


def send_approval_email(
    recipient: str,
    username: str,
    approved: bool,
    note: str = None,
) -> bool:
    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
    status = "approved" if approved else "rejected"
    body = (
        "Your account has been approved. You can now log in."
        if approved
        else "Unfortunately, your registration request has been rejected."
    )

    html_body = render_template_string(
        APPROVAL_TEMPLATE,
        username=username,
        status=status,
        body=body,
        note=note,
        login_url=f"{frontend_url}/login",
    )

    msg = Message(
        subject=f"LogGuard — Registration {status.title()}",
        recipients=[recipient],
        html=html_body,
    )
    try:
        mail.send(msg)
        return True
    except Exception as exc:
        current_app.logger.error(f"Failed to send approval email to {recipient}: {exc}")
        return False


def send_report_email(
    recipient: str,
    report_title: str,
    file_path: str,
    generated_at: str,
) -> bool:
    from datetime import datetime

    html_body = render_template_string(
        REPORT_TEMPLATE,
        title=report_title,
        generated_at=generated_at,
    )

    msg = Message(
        subject=f"LogGuard Report — {report_title}",
        recipients=[recipient],
        html=html_body,
    )
    try:
        with open(file_path, "rb") as f:
            import os
            msg.attach(
                filename=os.path.basename(file_path),
                content_type="application/octet-stream",
                data=f.read(),
            )
        mail.send(msg)
        return True
    except Exception as exc:
        current_app.logger.error(f"Failed to send report email: {exc}")
        return False
