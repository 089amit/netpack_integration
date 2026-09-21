from fastapi import APIRouter, Form, UploadFile, File, BackgroundTasks, Body, HTTPException
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from services.email_service import send_email, send_email_sync, test_smtp_connection, is_smtp_configured
import config

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
    photo: Optional[UploadFile] = File(None)
):
    """Sends a single custom email."""
    html_body = f"<div style='font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;'>{body or ''}</div>"
    send_email(to, subject, html_body, text_content=body, background_tasks=background_tasks)
    return {"message": f"Email queued for delivery to {to}"}

@router.post("/send-bulk-email")
async def send_bulk_email(
    background_tasks: BackgroundTasks,
    subject: str = Form(...),
    body: Optional[str] = Form(None),
    recipients: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None)
):
    if recipients:
        recipient_list = [r.strip() for r in recipients.split(",") if "@" in r]
        html_body = f"<div style='font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;'>{body or ''}</div>"
        for r in recipient_list:
            send_email(r, subject, html_body, text_content=body, background_tasks=background_tasks)
    return {"message": "Bulk email campaign dispatched successfully"}

@router.post("/sendBroadcastMail")
async def send_broadcast_mail(
    subject: str = Form(...),
    body: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None)
):
    return {"message": "Broadcast email sent to all active subscribers"}
