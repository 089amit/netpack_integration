import smtplib
import ssl
import socket
import logging
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Union
from fastapi import BackgroundTasks
import config

logger = logging.getLogger("netpack.email")

# 🌐 Force IPv4 address resolution for SMTP/Mail to prevent [Errno 101] Network is unreachable in cloud Docker containers
_orig_getaddrinfo = socket.getaddrinfo

def _ipv4_forced_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if family == 0 and isinstance(host, str) and ("smtp" in host or "mail" in host or "gmail" in host or "google" in host):
        try:
            return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
        except Exception:
            pass
    return _orig_getaddrinfo(host, port, family, type, proto, flags)

socket.getaddrinfo = _ipv4_forced_getaddrinfo


def is_smtp_configured() -> bool:
    """Returns True if minimum SMTP or HTTPS email parameters are set in environment."""
    if config.RESEND_API_KEY or config.BREVO_API_KEY:
        return True
    return bool(config.SMTP_HOST and config.SMTP_USER and config.SMTP_PASSWORD)


def send_email_sync(
    to_emails: Union[str, List[str]],
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    from_name: Optional[str] = None,
    from_email: Optional[str] = None
) -> dict:
    """
    Synchronously sends an email via SMTP.
    Used inside BackgroundTasks to avoid blocking FastAPI request cycles.
    """
    if isinstance(to_emails, str):
        to_emails = [to_emails]

    clean_recipients = [e.strip() for e in to_emails if e and "@" in e]
    if not clean_recipients:
        return {"success": False, "error": "No valid recipient email addresses provided"}

    sender_email = from_email or config.SMTP_FROM_EMAIL or config.SMTP_USER
    sender_name = from_name or config.SMTP_FROM_NAME or "NetPack Logistics"

    if not is_smtp_configured():
        logger.info(
            f"[EmailService SIMULATED] SMTP not configured. Skipped sending email.\n"
            f"  Subject: {subject}\n"
            f"  To: {', '.join(clean_recipients)}\n"
            f"  (Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env to enable real sending)"
        )
        return {
            "success": True,
            "simulated": True,
            "recipients": clean_recipients,
            "message": "Email logged (SMTP credentials not configured in .env)"
        }

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{sender_name} <{sender_email}>"
    message["To"] = ", ".join(clean_recipients)

    if text_content:
        part1 = MIMEText(text_content, "plain", "utf-8")
        message.attach(part1)

    part2 = MIMEText(html_content, "html", "utf-8")
    message.attach(part2)

    # 1. First priority: Check if Resend HTTPS API Key is configured (runs over port 443 - NEVER blocked by Railway)
    if config.RESEND_API_KEY:
        try:
            resend_url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {config.RESEND_API_KEY.strip()}",
                "Content-Type": "application/json"
            }
            # If domain is verified use sender_email, otherwise default to onboarding@resend.dev
            from_field = f"{sender_name} <{sender_email}>"
            if not config.SMTP_FROM_EMAIL or "resend.dev" in config.RESEND_API_KEY:
                from_field = f"{sender_name} <onboarding@resend.dev>"

            payload = {
                "from": from_field,
                "to": clean_recipients,
                "subject": subject,
                "html": html_content
            }
            if text_content:
                payload["text"] = text_content

            r = requests.post(resend_url, json=payload, headers=headers, timeout=12)
            if r.status_code in (200, 201):
                logger.info(f"[EmailService Resend HTTPS SUCCESS] Sent '{subject}' to {clean_recipients}")
                return {"success": True, "provider": "Resend (HTTPS Port 443)", "recipients": clean_recipients}
            else:
                logger.warning(f"[EmailService Resend Warning] Status {r.status_code}: {r.text}. Falling back to SMTP...")
        except Exception as resend_err:
            logger.warning(f"[EmailService Resend Error] {resend_err}. Falling back to SMTP...")

    # 2. Second priority: Check if Brevo HTTPS API Key is configured (runs over port 443)
    if config.BREVO_API_KEY:
        try:
            brevo_url = "https://api.brevo.com/v3/smtp/email"
            headers = {
                "api-key": config.BREVO_API_KEY.strip(),
                "Content-Type": "application/json"
            }
            payload = {
                "sender": {"name": sender_name, "email": sender_email},
                "to": [{"email": e} for e in clean_recipients],
                "subject": subject,
                "htmlContent": html_content
            }
            if text_content:
                payload["textContent"] = text_content

            r = requests.post(brevo_url, json=payload, headers=headers, timeout=12)
            if r.status_code in (200, 201):
                logger.info(f"[EmailService Brevo HTTPS SUCCESS] Sent '{subject}' to {clean_recipients}")
                return {"success": True, "provider": "Brevo (HTTPS Port 443)", "recipients": clean_recipients}
            else:
                logger.warning(f"[EmailService Brevo Warning] Status {r.status_code}: {r.text}. Falling back to SMTP...")
        except Exception as brevo_err:
            logger.warning(f"[EmailService Brevo Error] {brevo_err}. Falling back to SMTP...")

    # 3. Third priority: Raw SMTP with automatic dual-port and forced IPv4 resolution
    host = config.SMTP_HOST
    pref_port = int(config.SMTP_PORT or 587)

    pref_ssl = bool(config.SMTP_USE_SSL) or pref_port == 465

    attempts = []
    if pref_ssl:
        attempts.append({"port": pref_port, "ssl": True})
        if pref_port != 587:
            attempts.append({"port": 587, "ssl": False})
    else:
        attempts.append({"port": pref_port, "ssl": False})
        if pref_port != 465:
            attempts.append({"port": 465, "ssl": True})

    last_err = None
    for attempt in attempts:
        curr_port = attempt["port"]
        curr_ssl = attempt["ssl"]
        try:
            if curr_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(host, curr_port, context=context, timeout=15) as server:
                    if config.SMTP_USER and config.SMTP_PASSWORD:
                        server.login(config.SMTP_USER, config.SMTP_PASSWORD)
                    server.sendmail(sender_email, clean_recipients, message.as_string())
            else:
                with smtplib.SMTP(host, curr_port, timeout=15) as server:
                    server.ehlo()
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()
                    if config.SMTP_USER and config.SMTP_PASSWORD:
                        server.login(config.SMTP_USER, config.SMTP_PASSWORD)
                    server.sendmail(sender_email, clean_recipients, message.as_string())

            logger.info(f"[EmailService SUCCESS] Sent '{subject}' to {clean_recipients} via port {curr_port} (SSL={curr_ssl})")
            return {"success": True, "recipients": clean_recipients, "port": curr_port}
        except Exception as err:
            last_err = err
            logger.warning(f"[EmailService Attempt Failed] Port {curr_port} (SSL={curr_ssl}): {err}. Trying alternate configuration...")

    logger.error(f"[EmailService ERROR] Failed sending to {clean_recipients}: {last_err}")
    return {"success": False, "error": str(last_err), "recipients": clean_recipients}


def send_email(
    to_emails: Union[str, List[str]],
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    background_tasks: Optional[BackgroundTasks] = None
):
    """Dispatches email asynchronously if background_tasks is supplied, else synchronously."""
    if background_tasks:
        background_tasks.add_task(send_email_sync, to_emails, subject, html_content, text_content)
    else:
        return send_email_sync(to_emails, subject, html_content, text_content)


# ─── Booking Confirmation & Receiver Copy ────────────────────────────────────

def build_booking_html(
    enquiry,
    is_receiver_copy: bool = False,
    tracking_url: str = "https://netpacklogistic.com"
) -> str:
    """Builds a responsive, modern HTML email template for NetPack Logistics."""
    tracking_no = getattr(enquiry, "trackingNumber", "NP-000000")
    sender_name = getattr(enquiry, "senderName", "Sender") or "Shipper"
    receiver_name = getattr(enquiry, "receiverName", "Consignee") or "Consignee"
    dest_loc = getattr(enquiry, "destinationLocation", "") or getattr(enquiry, "receiverCity", "") or "Destination"
    dest_country = getattr(enquiry, "receiverCountry", "") or ""
    weight = getattr(enquiry, "weight", "1.0") or "1.0"
    boxes = getattr(enquiry, "noOfBox", 1) or 1
    status = getattr(enquiry, "status", "ENQUIRY_GENERATED") or "ENQUIRY_GENERATED"
    status_label = status.replace("_", " ").title()

    if is_receiver_copy:
        badge_text = "CONSIGNEE COPY"
        greeting = f"Namaste / Hello {receiver_name},"
        headline = "An Express Air Consignment Has Been Booked for You"
        summary_p = f"An international express shipment destined to you has been booked by <strong>{sender_name}</strong> via NetPack Logistics. You can track this parcel in real-time."
    else:
        badge_text = "BOOKING CONFIRMATION"
        greeting = f"Namaste / Hello {sender_name},"
        headline = "Your Shipment Booking is Confirmed"
        summary_p = f"Thank you for choosing NetPack Logistics. Your air consignment (Tracking #<strong>{tracking_no}</strong>) has been registered in our system and is ready for logistics processing."

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NetPack Logistics - AWB {tracking_no}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; color: #1e293b; }}
  .container {{ max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
  .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 28px 24px; text-align: center; color: #ffffff; }}
  .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
  .badge {{ display: inline-block; background: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; margin-top: 8px; text-transform: uppercase; }}
  .content {{ padding: 28px 24px; }}
  .greeting {{ font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }}
  .lead {{ font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }}
  .tracking-box {{ background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px; }}
  .tracking-label {{ font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }}
  .tracking-number {{ font-family: monospace, Courier, monospace; font-size: 22px; font-weight: 800; color: #1e3a8a; letter-spacing: 2px; margin: 6px 0; }}
  .status-pill {{ display: inline-block; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 12px; }}
  .table-box {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }}
  .table-box td {{ padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }}
  .table-box td.label {{ font-weight: 600; color: #64748b; width: 35%; }}
  .table-box td.val {{ color: #0f172a; font-weight: 500; }}
  .btn-track {{ display: block; width: fit-content; margin: 24px auto 12px auto; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-align: center; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25); }}
  .footer {{ background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  .footer p {{ margin: 4px 0; }}
  .footer a {{ color: #2563eb; text-decoration: none; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>NETPACK LOGISTICS</h1>
    <div class="badge">{badge_text}</div>
  </div>

  <div class="content">
    <div class="greeting">{greeting}</div>
    <p class="lead">{summary_p}</p>

    <div class="tracking-box">
      <div class="tracking-label">Airway Bill / Tracking Number</div>
      <div class="tracking-number">{tracking_no}</div>
      <div class="status-pill">{status_label}</div>
    </div>

    <table class="table-box">
      <tr>
        <td class="label">Shipper (Sender)</td>
        <td class="val">{sender_name}</td>
      </tr>
      <tr>
        <td class="label">Consignee (Receiver)</td>
        <td class="val">{receiver_name}</td>
      </tr>
      <tr>
        <td class="label">Destination</td>
        <td class="val">{dest_loc}{f', {dest_country}' if dest_country else ''}</td>
      </tr>
      <tr>
        <td class="label">Package Details</td>
        <td class="val">{boxes} box(es) &bull; ~{weight} kg</td>
      </tr>
      <tr>
        <td class="label">Service</td>
        <td class="val">Worldwide Express Air Cargo</td>
      </tr>
    </table>

    <a href="{tracking_url}" class="btn-track" target="_blank">Track Consignment Live</a>
  </div>

  <div class="footer">
    <p><strong>NetPack Logistics Pvt. Ltd.</strong></p>
    <p>Cargo & Courier Services Worldwide | Kathmandu, Nepal</p>
    <p>Hotline: +977-1-4567890 | Email: <a href="mailto:info@netpacklogistic.com">info@netpacklogistic.com</a></p>
    <p style="margin-top: 10px; font-size: 11px; color: #cbd5e1;">This is an automated operational notification. If you received this by mistake, please contact support.</p>
  </div>
</div>
</body>
</html>
"""

def send_enquiry_booking_notification(
    enquiry,
    background_tasks: Optional[BackgroundTasks] = None
):
    """
    Sends booking confirmation email to sender AND automatically sends
    a copy to the receiver if receiverEmail is provided.
    """
    tracking_no = getattr(enquiry, "trackingNumber", "")
    sender_email = (getattr(enquiry, "senderEmail", "") or "").strip()
    receiver_email = (getattr(enquiry, "receiverEmail", "") or "").strip()

    frontend_base = getattr(config, "FRONTEND_URL", "http://localhost:8000") or "http://localhost:8000"
    tracking_url = f"{frontend_base.rstrip('/')}/#track?q={tracking_no}"

    # 1. Send confirmation to Sender (if email exists)
    if sender_email and "@" in sender_email:
        subject = f"[NetPack Logistics] Booking Confirmation - AWB #{tracking_no}"
        html = build_booking_html(enquiry, is_receiver_copy=False, tracking_url=tracking_url)
        send_email(
            to_emails=sender_email,
            subject=subject,
            html_content=html,
            background_tasks=background_tasks
        )
        logger.info(f"[EmailService] Dispatched booking confirmation to sender: {sender_email}")

    # 2. Send Consignee copy to Receiver (if receiverEmail is provided!)
    if receiver_email and "@" in receiver_email:
        # Avoid double-sending if sender and receiver email are the exact same
        if receiver_email.lower() != sender_email.lower():
            subject = f"[NetPack Logistics] Incoming Consignment Notification - AWB #{tracking_no}"
            html = build_booking_html(enquiry, is_receiver_copy=True, tracking_url=tracking_url)
            send_email(
                to_emails=receiver_email,
                subject=subject,
                html_content=html,
                background_tasks=background_tasks
            )
            logger.info(f"[EmailService] Dispatched consignee copy to receiver: {receiver_email}")
        else:
            logger.info(f"[EmailService] Receiver email matches sender email ({receiver_email}). Single copy sent.")


def test_smtp_connection(target_email: str) -> dict:
    """Diagnostic tool to verify SMTP server handshake and credentials."""
    subject = "[NetPack Logistics] SMTP Integration Diagnostic Ping"
    html = f"""
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #22c55e; border-radius: 8px; max-width: 500px;">
      <h2 style="color: #16a34a; margin-top: 0;">&#10004; NetPack SMTP Test Successful</h2>
      <p>Congratulations! Your SMTP credentials configured on NetPack Logistics backend are active and operational.</p>
      <p><strong>Host:</strong> {config.SMTP_HOST}:{config.SMTP_PORT}</p>
      <p><strong>User:</strong> {config.SMTP_USER}</p>
      <p><strong>Target:</strong> {target_email}</p>
    </div>
    """
    return send_email_sync(target_email, subject, html)


def build_user_welcome_html(
    full_name: str,
    email: str,
    role_name: str,
    password: Optional[str] = None,
    login_url: str = ""
) -> str:
    """Branded responsive email for newly created accounts and signups."""
    pw_block = ""
    if password:
        pw_block = f"""
        <div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</p>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #0f172a;"><strong>Email:</strong> {email}</p>
          <p style="margin: 0; font-size: 14px; color: #0f172a;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 15px; font-weight: bold; color: #0f172a;">{password}</code></p>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: -10px;">For security, we recommend changing your password after your first login.</p>
        """

    portal_name = "Rider Mobile PWA" if role_name.upper() == "PICKUP" else "Staff & Operations Portal"

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
<div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 30px; text-align: left;">
    <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: -0.5px;">NetPack Logistics</h1>
    <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Enterprise Freight & Logistics Management</p>
  </div>
  <div style="padding: 28px 30px;">
    <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Welcome to NetPack, {full_name}!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Your account has been successfully created with the role of <strong>{role_name.upper()}</strong>.
      You can now access the {portal_name} to manage shipments, bookings, and operations.
    </p>
    {pw_block}
    <div style="margin: 26px 0 20px 0; text-align: center;">
      <a href="{login_url}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Log in to {portal_name} &rarr;</a>
    </div>
  </div>
  <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 30px; font-size: 12px; color: #64748b; text-align: center;">
    <p style="margin: 0;">NetPack Logistics Cargo Terminal, Kathmandu, Nepal</p>
    <p style="margin: 4px 0 0 0;">Need help? Email <a href="mailto:info@netpacklogistic.com" style="color: #0284c7;">info@netpacklogistic.com</a></p>
  </div>
</div>
</body>
</html>"""


def send_user_welcome_email(
    to_email: str,
    full_name: str,
    role_name: str = "STAFF",
    password: Optional[str] = None,
    background_tasks: Optional[BackgroundTasks] = None
):
    """Dispatches welcome & credentials email to newly registered or admin-created user."""
    frontend_base = getattr(config, "FRONTEND_URL", "http://localhost:8000") or "http://localhost:8000"
    if role_name.upper() == "PICKUP":
        login_url = f"{frontend_base.rstrip('/')}/pickup-pwa"
    elif role_name.upper() == "CUSTOMER":
        login_url = f"{frontend_base.rstrip('/')}/pwa"
    else:
        login_url = f"{frontend_base.rstrip('/')}/sign-in"

    subject = f"[NetPack Logistics] Welcome to NetPack — Your Account Details"
    html = build_user_welcome_html(
        full_name=full_name,
        email=to_email,
        role_name=role_name,
        password=password,
        login_url=login_url
    )
    send_email(
        to_emails=to_email,
        subject=subject,
        html_content=html,
        background_tasks=background_tasks
    )
    logger.info(f"[EmailService] Dispatched welcome email to: {to_email}")


def build_forgot_password_html(full_name: str, reset_code: str, reset_url: str = "") -> str:
    """Password reset instructions and verification code email."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
<div style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 22px 28px;">
    <h1 style="color: #ffffff; margin: 0; font-size: 19px;">NetPack Logistics</h1>
    <p style="color: #94a3b8; margin: 3px 0 0 0; font-size: 12px;">Security & Account Recovery</p>
  </div>
  <div style="padding: 26px 28px;">
    <h2 style="color: #0f172a; margin-top: 0; font-size: 17px;">Password Reset Request</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Hello {full_name}, we received a request to reset your password for your NetPack Logistics account.
    </p>
    <div style="background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Your Security Verification Code</p>
      <p style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #0284c7;">{reset_code}</p>
    </div>
    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
      This verification code is valid for <strong>15 minutes</strong>. If you did not request this code, you can safely ignore this email — your account remains secure.
    </p>
    <div style="margin: 24px 0 16px 0; text-align: center;">
      <a href="{reset_url}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password &rarr;</a>
    </div>
  </div>
  <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 28px; font-size: 12px; color: #64748b; text-align: center;">
    <p style="margin: 0;">NetPack Logistics Security Team &bull; info@netpacklogistic.com</p>
  </div>
</div>
</body>
</html>"""


def send_forgot_password_email(
    to_email: str,
    full_name: str,
    reset_code: str,
    background_tasks: Optional[BackgroundTasks] = None
):
    """Dispatches password reset verification email."""
    frontend_base = getattr(config, "FRONTEND_URL", "http://localhost:8000") or "http://localhost:8000"
    reset_url = f"{frontend_base.rstrip('/')}/otp?email={to_email}"
    subject = f"[NetPack Logistics] Password Reset Verification Code: {reset_code}"
    html = build_forgot_password_html(full_name=full_name, reset_code=reset_code, reset_url=reset_url)
    send_email(
        to_emails=to_email,
        subject=subject,
        html_content=html,
        background_tasks=background_tasks
    )
    logger.info(f"[EmailService] Dispatched password reset email to: {to_email}")

