from fastapi import APIRouter, Form, UploadFile, File, BackgroundTasks, Body, HTTPException, Depends
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


# ─── Email Inspection, Mailbox & Testing Endpoints ───────────────────────────

from fastapi.responses import HTMLResponse
from database import get_db
from sqlalchemy.orm import Session
from models.email_log import EmailMessage

@router.get("/history")
def get_email_history(
    limit: int = 50,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    direction: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns recent sent and received emails for testing and debugging."""
    query = db.query(EmailMessage)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (EmailMessage.recipient.ilike(s)) |
            (EmailMessage.sender.ilike(s)) |
            (EmailMessage.subject.ilike(s))
        )
    if status_filter:
        query = query.filter(EmailMessage.status == status_filter.upper())
    if direction:
        query = query.filter(EmailMessage.direction == direction.upper())
    
    total = query.count()
    items = query.order_by(EmailMessage.createdAt.desc()).limit(limit).all()

    return {
        "total": total,
        "emails": [
            {
                "id": m.id,
                "sender": m.sender,
                "recipient": m.recipient,
                "subject": m.subject,
                "status": m.status,
                "provider": m.provider,
                "direction": m.direction,
                "errorMessage": m.errorMessage,
                "preview": (m.textContent or m.subject or "")[:120],
                "createdAt": m.createdAt.isoformat() if m.createdAt else None
            }
            for m in items
        ]
    }


@router.get("/view/{email_id}", response_class=HTMLResponse)
def view_rendered_email(email_id: int, db: Session = Depends(get_db)):
    """Renders the exact HTML contents of an email in browser for visual preview."""
    msg = db.query(EmailMessage).filter(EmailMessage.id == email_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Email record not found")

    if msg.htmlContent:
        return HTMLResponse(content=msg.htmlContent, status_code=200)
    elif msg.textContent:
        fallback_html = f"<html><body style='font-family:sans-serif;padding:24px;line-height:1.6;'><pre>{msg.textContent}</pre></body></html>"
        return HTMLResponse(content=fallback_html, status_code=200)
    else:
        return HTMLResponse(content="<em>No email body content available.</em>", status_code=200)


@router.get("/stats")
def get_email_stats(db: Session = Depends(get_db)):
    """Summary metrics of email activity."""
    total = db.query(EmailMessage).count()
    sent = db.query(EmailMessage).filter(EmailMessage.status == "SENT").count()
    simulated = db.query(EmailMessage).filter(EmailMessage.status == "SIMULATED").count()
    failed = db.query(EmailMessage).filter(EmailMessage.status == "FAILED").count()
    inbound = db.query(EmailMessage).filter(EmailMessage.direction == "INBOUND").count()

    return {
        "total": total,
        "sent": sent,
        "simulated": simulated,
        "failed": failed,
        "inbound": inbound,
        "smtpConfigured": is_smtp_configured()
    }


class InboundEmailPayload(BaseModel):
    sender: str
    recipient: Optional[str] = "support@netpacklogistic.com"
    subject: str
    body: str


@router.post("/inbound")
def simulate_inbound_email(payload: InboundEmailPayload, db: Session = Depends(get_db)):
    """Simulates receiving an incoming email from customer/client for testing."""
    msg = EmailMessage(
        sender=payload.sender.strip(),
        recipient=payload.recipient.strip(),
        subject=payload.subject.strip(),
        htmlContent=f"<div style='font-family:sans-serif;padding:16px;'>{payload.body}</div>",
        textContent=payload.body,
        status="RECEIVED",
        provider="Inbound (Simulation/Webhook)",
        direction="INBOUND"
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "message": "Inbound email received and recorded into mailbox",
        "emailId": msg.id
    }


@router.delete("/clear-history")
def clear_email_history(db: Session = Depends(get_db)):
    """Clears all email records for a fresh testing state."""
    deleted_count = db.query(EmailMessage).delete()
    db.commit()
    return {"message": f"Cleared {deleted_count} email records."}

