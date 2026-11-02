import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Any
from pydantic import BaseModel
from database import get_db
from models.website_content import WebsiteContent

router = APIRouter(prefix="/api/website-content", tags=["Website Content"])

class WebsiteContentPayload(BaseModel):
    heroTitle: Optional[str] = None
    heroSubtitle: Optional[str] = None
    heroBadge: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    contactAddress: Optional[str] = None
    businessHours: Optional[str] = None
    googleMapsUrl: Optional[str] = None
    mapCoordinates: Optional[str] = None
    tickerItems: Optional[List[str]] = None
    festiveTheme: Optional[str] = None
    festiveGreeting: Optional[str] = None

class ContactMessageRequest(BaseModel):
    fullName: str
    email: str
    phone: Optional[str] = None
    serviceInterest: Optional[str] = None
    message: str

def _format_content(row: WebsiteContent):
    ticker_list = []
    if row.tickerItems:
        try:
            ticker_list = json.loads(row.tickerItems)
        except Exception:
            ticker_list = [item.strip() for item in row.tickerItems.split(",") if item.strip()]
    return {
        "id": row.id,
        "heroTitle": row.heroTitle or "Fast & Reliable Courier Services in Teku, Kathmandu",
        "heroSubtitle": row.heroSubtitle or "Your trusted partner for secure package delivery across Nepal and worldwide. Track your shipment in real-time.",
        "heroBadge": row.heroBadge or "Teku, Kathmandu Headquarters",
        "contactPhone": row.contactPhone or "+977 15339942",
        "contactEmail": row.contactEmail or "info@netpacklogistic.com",
        "contactAddress": row.contactAddress or "Teku-12, Kathmandu, Nepal",
        "businessHours": row.businessHours or "10:00 am - 5:00 pm (Sun - Fri)",
        "googleMapsUrl": getattr(row, "googleMapsUrl", None) or "https://maps.google.com/maps?q=27.6975,85.3090&hl=en&z=16&output=embed",
        "mapCoordinates": getattr(row, "mapCoordinates", None) or "27.6975, 85.3090",
        "tickerItems": ticker_list,
        "festiveTheme": getattr(row, "festiveTheme", None) or "auto",
        "festiveGreeting": getattr(row, "festiveGreeting", None) or "",
        "updatedAt": row.updatedAt.isoformat() if row.updatedAt else None
    }

@router.get("")
@router.get("/")
def get_website_content(db: Session = Depends(get_db)):
    try:
        content = db.query(WebsiteContent).first()
        if not content:
            content = WebsiteContent()
            db.add(content)
            db.commit()
            db.refresh(content)
        return _format_content(content)
    except Exception as e:
        print(f"[WebsiteContent Warning] Fallback content served: {e}")
        return {
            "id": 1,
            "heroTitle": "Fast & Reliable Courier Services in Teku, Kathmandu",
            "heroSubtitle": "Your trusted partner for secure package delivery across Nepal and worldwide. Track your shipment in real-time.",
            "heroBadge": "Teku, Kathmandu Headquarters",
            "contactPhone": "+977 15339942",
            "contactEmail": "info@netpacklogistic.com",
            "contactAddress": "Teku Road, Ward No. 15, Kathmandu, Nepal",
            "businessHours": "10:00 am - 5:00 pm (Sun - Fri)",
            "tickerItems": [
                "Reliable International Air Cargo",
                "Express Express Courier to 220+ Countries",
                "Daily Kathmandu Pickup & Delivery",
                "Live Real-Time Package Tracking"
            ],
            "festiveTheme": "auto",
            "festiveGreeting": "Happy Vijaya Dashami & Deepawali 2081! Wishing peace and prosperity to all our valued clients.",
            "updatedAt": None
        }

@router.put("")
@router.put("/")
@router.post("")
@router.post("/")
def update_website_content(payload: WebsiteContentPayload, db: Session = Depends(get_db)):
    content = db.query(WebsiteContent).first()
    if not content:
        content = WebsiteContent()
        db.add(content)
        db.commit()
        db.refresh(content)

    if payload.heroTitle is not None:
        content.heroTitle = payload.heroTitle
    if payload.heroSubtitle is not None:
        content.heroSubtitle = payload.heroSubtitle
    if payload.heroBadge is not None:
        content.heroBadge = payload.heroBadge
    if payload.contactPhone is not None:
        content.contactPhone = payload.contactPhone
    if payload.contactEmail is not None:
        content.contactEmail = payload.contactEmail
    if payload.contactAddress is not None:
        content.contactAddress = payload.contactAddress
    if payload.businessHours is not None:
        content.businessHours = payload.businessHours
    if payload.googleMapsUrl is not None:
        content.googleMapsUrl = payload.googleMapsUrl
    if payload.mapCoordinates is not None:
        content.mapCoordinates = payload.mapCoordinates
    if payload.tickerItems is not None:
        content.tickerItems = json.dumps(payload.tickerItems)
    if payload.festiveTheme is not None:
        content.festiveTheme = payload.festiveTheme
    if payload.festiveGreeting is not None:
        content.festiveGreeting = payload.festiveGreeting

    db.commit()
    db.refresh(content)
    return {
        "message": "Website content updated successfully",
        "content": _format_content(content)
    }

@router.post("/contact-message")
def submit_contact_message(payload: ContactMessageRequest):
    """
    Submits user inquiry from website contact form directly to info@netpacklogistic.com.
    Does NOT book an enquiry/shipment in the database.
    """
    subject = f"[Website Inquiry] New Message from {payload.fullName}"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #0066CC; margin-top: 0; border-bottom: 2px solid #0066CC; padding-bottom: 10px;">Website Contact Form Message</h2>
      <p style="margin: 8px 0;"><strong>Sender Name:</strong> {payload.fullName}</p>
      <p style="margin: 8px 0;"><strong>Sender Email:</strong> <a href="mailto:{payload.email}">{payload.email}</a></p>
      <p style="margin: 8px 0;"><strong>Phone / WhatsApp:</strong> {payload.phone or 'Not provided'}</p>
      <p style="margin: 8px 0;"><strong>Service of Interest:</strong> {payload.serviceInterest or 'General Inquiry'}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 18px 0;" />
      <p style="margin: 8px 0;"><strong>Message:</strong></p>
      <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border-left: 4px solid #0066CC; white-space: pre-wrap; font-size: 14px; color: #1e293b; line-height: 1.6;">{payload.message}</div>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; text-align: center;">
        Dispatched automatically from Netpack Logistic Website Contact Desk &bull; Teku-12, Kathmandu
      </p>
    </div>
    """
    try:
        from services.email_service import send_email
        send_email(
            to_emails=["info@netpacklogistic.com", "admin@netpacklogistic.com"],
            subject=subject,
            html_content=html_content
        )
    except Exception as e:
        print(f"[ContactMessage Error] Could not send email via SMTP: {e}")

    return {
        "success": True,
        "message": "Message sent successfully to info@netpacklogistic.com"
    }
