from flask import current_app


def send_whatsapp_report(
    to_number: str,
    report_title: str,
    file_path: str = None,
    message_body: str = None,
) -> tuple[bool, str]:
    """
    Send a WhatsApp message (and optionally a media file) via Twilio.
    to_number should be in E.164 format, e.g. "+1234567890".
    Returns (success: bool, sid_or_error: str).
    """
    try:
        from twilio.rest import Client
    except ImportError:
        return False, "Twilio library not installed."

    account_sid = current_app.config.get("TWILIO_ACCOUNT_SID")
    auth_token = current_app.config.get("TWILIO_AUTH_TOKEN")
    from_number = current_app.config.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

    if not account_sid or not auth_token:
        return False, "Twilio credentials not configured."

    if not to_number.startswith("whatsapp:"):
        to_number = f"whatsapp:{to_number}"

    body = message_body or f"LogGuard Report: *{report_title}* is ready for download."

    try:
        client = Client(account_sid, auth_token)
        msg_kwargs = {
            "from_": from_number,
            "to": to_number,
            "body": body,
        }
        message = client.messages.create(**msg_kwargs)
        return True, message.sid
    except Exception as exc:
        current_app.logger.error(f"WhatsApp send failed: {exc}")
        return False, str(exc)
