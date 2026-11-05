from fastapi import APIRouter, Form, UploadFile, File, BackgroundTasks, Body, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import json
import logging
from database import get_db
from models.customer import Customer
from services.email_service import send_email, send_email_sync, test_smtp_connection, is_smtp_configured
import config

logger = logging.getLogger("netpack.email")

router = APIRouter(prefix="/api/sendEmail", tags=["Emails"])

class TestSmtpRequest(BaseModel):
    targetEmail: str

class SimpleEmailRequest(BaseModel):
    to: str
    subject: str
    body: str

@router.get("/smtp-status")
def get_smtp_status():
    """Checks whether SMTP configuration has been populated in environment."""
    configured = is_smtp_configured()
    return {
        "configured": configured,
        "host": config.SMTP_HOST or "Not configured",
        "port": config.SMTP_PORT,
        "user": config.SMTP_USER or "Not configured",
        "fromEmail": config.SMTP_FROM_EMAIL or config.SMTP_USER or "Not configured",
        "replyTo": getattr(config, "SMTP_REPLY_TO", "info@netpacklogistic.com"),
        "useTls": config.SMTP_USE_TLS,
        "useSsl": config.SMTP_USE_SSL,
        "mode": "Live SMTP" if configured else "Simulated (Logs to console)"
    }

@router.post("/test-smtp")
def run_smtp_diagnostic(payload: TestSmtpRequest):
    """Sends a diagnostic ping to test target email and verify SMTP credentials."""
    target = payload.targetEmail.strip()
    if not target or "@" not in target:
        raise HTTPException(status_code=400, detail="Please provide a valid target email address")
    
    res = test_smtp_connection(target)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=f"SMTP diagnostic failed: {res.get('error', 'Unknown error')}")
    
    return {
        "message": f"Diagnostic email sent to {target}",
        "details": res
    }

@router.post("/send-email")
async def send_single_email(
    background_tasks: BackgroundTasks,
    to: str = Form(...),
    subject: str = Form(...),
    body: Optional[str] = Form(None),
    emailContent: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None)
):
    """Sends a single custom email."""
    content = emailContent or body or ""
    html_body = f"""<div style='font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 600px; padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;'>
      <div style='white-space: pre-wrap;'>{content}</div>
    </div>"""
    send_email(to, subject, html_body, text_content=content, background_tasks=background_tasks)
    return {"message": f"Email queued for delivery to {to}"}

@router.post("/send-bulk-email")
async def send_bulk_email(
    background_tasks: BackgroundTasks,
    subject: str = Form(...),
    body: Optional[str] = Form(None),
    emailContent: Optional[str] = Form(None),
    recipients: Optional[str] = Form(None),
    emails: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None)
):
    content = emailContent or body or ""
    recipient_list = []

    # 1. Parse 'emails' field (frontend sends JSON array or comma-separated string)
    if emails:
        clean_raw = emails.strip()
        if clean_raw.startswith("["):
            try:
                parsed = json.loads(clean_raw)
                if isinstance(parsed, list):
                    recipient_list.extend([str(item).strip() for item in parsed if item and "@" in str(item)])
            except Exception:
                pass
        if not recipient_list:
            recipient_list.extend([r.strip() for r in clean_raw.split(",") if "@" in r])

    # 2. Parse fallback 'recipients' field
    if recipients and not recipient_list:
        clean_raw = recipients.strip()
        if clean_raw.startswith("["):
            try:
                parsed = json.loads(clean_raw)
                if isinstance(parsed, list):
                    recipient_list.extend([str(item).strip() for item in parsed if item and "@" in str(item)])
            except Exception:
                pass
        if not recipient_list:
            recipient_list.extend([r.strip() for r in clean_raw.split(",") if "@" in r])

    # Deduplicate while preserving order
    unique_recipients = list(dict.fromkeys(recipient_list))

    if not unique_recipients:
        raise HTTPException(status_code=400, detail="No valid recipient email addresses provided")

    html_body = f"""<div style='font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 600px; padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;'>
      <div style='white-space: pre-wrap;'>{content}</div>
    </div>"""

    for r in unique_recipients:
        send_email(r, subject, html_body, text_content=content, background_tasks=background_tasks)

    return {
        "message": f"Bulk email dispatched to {len(unique_recipients)} recipient(s)",
        "count": len(unique_recipients),
        "recipients": unique_recipients
    }

@router.post("/sendBroadcastMail")
async def send_broadcast_mail(
    background_tasks: BackgroundTasks,
    subject: str = Form(...),
    body: Optional[str] = Form(None),
    emailContent: Optional[str] = Form(None),
    sendToAll: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    content = emailContent or body or ""
    customers = db.query(Customer).filter(Customer.email.isnot(None), Customer.email != "").all()
    all_emails = [c.email.strip() for c in customers if c.email and "@" in c.email]
    unique_recipients = list(dict.fromkeys(all_emails))

    if not unique_recipients:
        return {"message": "No active customer emails found to broadcast", "count": 0}

    html_body = f"""<div style='font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 600px; padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;'>
      <div style='white-space: pre-wrap;'>{content}</div>
    </div>"""

    for r in unique_recipients:
        send_email(r, subject, html_body, text_content=content, background_tasks=background_tasks)

    return {
        "message": f"Broadcast email sent to {len(unique_recipients)} customer(s)",
        "count": len(unique_recipients)
    }
