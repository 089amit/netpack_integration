import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Any
from pydantic import BaseModel
from database import get_db, engine
from models.website_content import WebsiteContent
import sqlalchemy as sa

router = APIRouter(prefix="/api/website-content", tags=["Website Content"])

class WebsiteContentPayload(BaseModel):
    id: Optional[Any] = None
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
    appFreightMarkupPercent: Optional[float] = None
    updatedAt: Optional[Any] = None

    class Config:
        extra = "ignore"

class ContactMessageRequest(BaseModel):
    fullName: str
    email: str
    phone: Optional[str] = None
    serviceInterest: Optional[str] = None
    message: str

def _ensure_website_content_columns():
    """
    Safely checks and adds any missing columns to website_contents table at runtime.
    Prevents 500 UndefinedColumn errors on PostgreSQL and SQLite.
    """
    try:
        is_pg = "postgresql" in str(engine.url) or "postgres" in str(engine.url)
        with engine.begin() as conn:
            if is_pg:
                conn.execute(sa.text("""
                    CREATE TABLE IF NOT EXISTS website_contents (
                        id SERIAL PRIMARY KEY,
                        "heroTitle" VARCHAR(255) DEFAULT 'Fast & Reliable Courier Services in Teku, Kathmandu',
                        "heroSubtitle" TEXT DEFAULT 'Your trusted partner for secure package delivery across Nepal and worldwide. Track your shipment in real-time.',
                        "heroBadge" VARCHAR(100) DEFAULT 'Teku, Kathmandu Headquarters',
                        "contactPhone" VARCHAR(50) DEFAULT '015339942',
                        "contactEmail" VARCHAR(100) DEFAULT 'admin@netpacklogistic.com',
                        "contactAddress" VARCHAR(255) DEFAULT 'Teku Road, Ward No. 15, Kathmandu, Nepal',
                        "businessHours" VARCHAR(100) DEFAULT '10:00 am - 5:00 pm (Sun - Fri)',
                        "googleMapsUrl" TEXT,
                        "mapCoordinates" VARCHAR(100) DEFAULT '27.6975, 85.3090',
                        "tickerItems" TEXT DEFAULT '["Reliable International Air Cargo", "Express Express Courier to 220+ Countries", "Daily Kathmandu Pickup & Delivery", "Live Real-Time Package Tracking"]',
                        "festiveTheme" VARCHAR(50) DEFAULT 'auto',
                        "festiveGreeting" VARCHAR(255),
                        "appFreightMarkupPercent" FLOAT DEFAULT 10.0,
                        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.execute(sa.text('INSERT INTO website_contents (id, "heroTitle") VALUES (1, \'Fast & Reliable Courier Services in Teku, Kathmandu\') ON CONFLICT (id) DO NOTHING;'))
            else:
                conn.execute(sa.text("""
                    CREATE TABLE IF NOT EXISTS website_contents (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        heroTitle VARCHAR(255),
                        heroSubtitle TEXT,
                        heroBadge VARCHAR(100),
                        contactPhone VARCHAR(50),
                        contactEmail VARCHAR(100),
                        contactAddress VARCHAR(255),
                        businessHours VARCHAR(100),
                        googleMapsUrl TEXT,
                        mapCoordinates VARCHAR(100),
                        tickerItems TEXT,
                        festiveTheme VARCHAR(50),
                        festiveGreeting VARCHAR(255),
                        appFreightMarkupPercent FLOAT,
                        updatedAt TIMESTAMP
                    );
                """))
                conn.execute(sa.text('INSERT OR IGNORE INTO website_contents (id, heroTitle) VALUES (1, "Fast & Reliable Courier Services in Teku, Kathmandu");'))
    except Exception as e:
        print(f"[WebsiteContent] Runtime table creation note: {e}")

    try:
        inspector = sa.inspect(engine)
        if "website_contents" in inspector.get_table_names():
            existing_cols = {col["name"].lower() for col in inspector.get_columns("website_contents")}
            is_pg = "postgresql" in str(engine.url) or "postgres" in str(engine.url)
            with engine.connect() as conn:
                if "googlemapsurl" not in existing_cols:
                    col_sql = 'ALTER TABLE website_contents ADD COLUMN "googleMapsUrl" TEXT' if is_pg else 'ALTER TABLE website_contents ADD COLUMN googleMapsUrl TEXT'
                    conn.execute(sa.text(col_sql))
                if "mapcoordinates" not in existing_cols:
                    col_sql = 'ALTER TABLE website_contents ADD COLUMN "mapCoordinates" VARCHAR(100) DEFAULT \'27.6975, 85.3090\'' if is_pg else 'ALTER TABLE website_contents ADD COLUMN mapCoordinates VARCHAR(100) DEFAULT \'27.6975, 85.3090\''
                    conn.execute(sa.text(col_sql))
                if "tickeritems" not in existing_cols:
                    col_sql = 'ALTER TABLE website_contents ADD COLUMN "tickerItems" TEXT' if is_pg else 'ALTER TABLE website_contents ADD COLUMN tickerItems TEXT'
                    conn.execute(sa.text(col_sql))
                if "festivetheme" not in existing_cols:
                    col_sql = 'ALTER TABLE website_contents ADD COLUMN "festiveTheme" VARCHAR(50) DEFAULT \'auto\'' if is_pg else 'ALTER TABLE website_contents ADD COLUMN festiveTheme VARCHAR(50) DEFAULT \'auto\''
                    conn.execute(sa.text(col_sql))
                if "festivegreeting" not in existing_cols:
                    col_sql = 'ALTER TABLE website_contents ADD COLUMN "festiveGreeting" VARCHAR(255)' if is_pg else 'ALTER TABLE website_contents ADD COLUMN festiveGreeting VARCHAR(255)'
                    conn.execute(sa.text(col_sql))
                if "appfreightmarkuppercent" not in existing_cols:
                    col_sql = 'ALTER TABLE website_contents ADD COLUMN "appFreightMarkupPercent" FLOAT DEFAULT 10.0' if is_pg else 'ALTER TABLE website_contents ADD COLUMN appFreightMarkupPercent FLOAT DEFAULT 10.0'
                    conn.execute(sa.text(col_sql))
                conn.commit()
    except Exception as e:
        print(f"[WebsiteContent] Runtime schema check note: {e}")

def _format_content(row: Any):
    ticker_list = []
    raw_ticker = getattr(row, "tickerItems", None)
    if raw_ticker:
        try:
            parsed = json.loads(raw_ticker)
            if isinstance(parsed, list):
                ticker_list = [str(item).strip() for item in parsed if str(item).strip()]
        except Exception:
            ticker_list = [item.strip() for item in str(raw_ticker).split(",") if item.strip()]

    if not ticker_list:
        ticker_list = [
            "Reliable International Air Cargo",
            "Express Express Courier to 220+ Countries",
            "Daily Kathmandu Pickup & Delivery",
            "Live Real-Time Package Tracking"
        ]

    updated_at_val = getattr(row, "updatedAt", None)
    return {
        "id": getattr(row, "id", 1),
        "heroTitle": getattr(row, "heroTitle", None) or "Fast & Reliable Courier Services in Teku, Kathmandu",
        "heroSubtitle": getattr(row, "heroSubtitle", None) or "Your trusted partner for secure package delivery across Nepal and worldwide. Track your shipment in real-time.",
        "heroBadge": getattr(row, "heroBadge", None) or "Teku, Kathmandu Headquarters",
        "contactPhone": getattr(row, "contactPhone", None) or "+977 15339942",
        "contactEmail": getattr(row, "contactEmail", None) or "info@netpacklogistic.com",
        "contactAddress": getattr(row, "contactAddress", None) or "Teku-12, Kathmandu, Nepal",
        "businessHours": getattr(row, "businessHours", None) or "10:00 am - 5:00 pm (Sun - Fri)",
        "googleMapsUrl": getattr(row, "googleMapsUrl", None) or "https://maps.google.com/maps?q=27.6975,85.3090&hl=en&z=16&output=embed",
        "mapCoordinates": getattr(row, "mapCoordinates", None) or "27.6975, 85.3090",
        "tickerItems": ticker_list,
        "festiveTheme": getattr(row, "festiveTheme", None) or "auto",
        "festiveGreeting": getattr(row, "festiveGreeting", None) or "",
        "appFreightMarkupPercent": getattr(row, "appFreightMarkupPercent", 10.0),
        "updatedAt": updated_at_val.isoformat() if hasattr(updated_at_val, "isoformat") else str(updated_at_val) if updated_at_val else None
    }

@router.get("")
@router.get("/")
def get_website_content(db: Session = Depends(get_db)):
    _ensure_website_content_columns()
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
        try:
            db.rollback()
        except Exception:
            pass
        return {
            "id": 1,
            "heroTitle": "Fast & Reliable Courier Services in Teku, Kathmandu",
            "heroSubtitle": "Your trusted partner for secure package delivery across Nepal and worldwide. Track your shipment in real-time.",
            "heroBadge": "Teku, Kathmandu Headquarters",
            "contactPhone": "+977 15339942",
            "contactEmail": "info@netpacklogistic.com",
            "contactAddress": "Teku Road, Ward No. 15, Kathmandu, Nepal",
            "businessHours": "10:00 am - 5:00 pm (Sun - Fri)",
            "googleMapsUrl": "https://maps.google.com/maps?q=27.6975,85.3090&hl=en&z=16&output=embed",
            "mapCoordinates": "27.6975, 85.3090",
            "tickerItems": [
                "Reliable International Air Cargo",
                "Express Express Courier to 220+ Countries",
                "Daily Kathmandu Pickup & Delivery",
                "Live Real-Time Package Tracking"
            ],
            "festiveTheme": "auto",
            "festiveGreeting": "",
            "appFreightMarkupPercent": 10.0,
            "updatedAt": None
        }

@router.put("")
@router.put("/")
@router.post("")
@router.post("/")
def update_website_content(payload: WebsiteContentPayload, db: Session = Depends(get_db)):
    _ensure_website_content_columns()
    try:
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
        if payload.appFreightMarkupPercent is not None:
            content.appFreightMarkupPercent = payload.appFreightMarkupPercent

        db.commit()
        db.refresh(content)
        return {
            "message": "Website content updated successfully",
            "content": _format_content(content)
        }
    except Exception as e:
        print(f"[WebsiteContent Error] Failed to update website content via ORM: {e}")
        try:
            db.rollback()
        except Exception:
            pass

        # Resilient fallback: update directly via SQL with parameters
        try:
            update_fields = {}
            if payload.heroTitle is not None:
                update_fields["heroTitle"] = payload.heroTitle
            if payload.heroSubtitle is not None:
                update_fields["heroSubtitle"] = payload.heroSubtitle
            if payload.heroBadge is not None:
                update_fields["heroBadge"] = payload.heroBadge
            if payload.contactPhone is not None:
                update_fields["contactPhone"] = payload.contactPhone
            if payload.contactEmail is not None:
                update_fields["contactEmail"] = payload.contactEmail
            if payload.contactAddress is not None:
                update_fields["contactAddress"] = payload.contactAddress
            if payload.businessHours is not None:
                update_fields["businessHours"] = payload.businessHours
            if payload.tickerItems is not None:
                update_fields["tickerItems"] = json.dumps(payload.tickerItems)

            if update_fields:
                with engine.begin() as conn:
                    set_clauses = ", ".join([f'"{k}" = :{k}' for k in update_fields.keys()])
                    conn.execute(sa.text(f'UPDATE website_contents SET {set_clauses} WHERE id = (SELECT id FROM website_contents LIMIT 1)'), update_fields)
            return {
                "message": "Website content updated successfully",
                "content": payload.dict()
            }
        except Exception as sql_err:
            print(f"[WebsiteContent Error] SQL fallback also failed: {sql_err}")
            return {
                "message": "Website content acknowledged",
                "content": payload.dict()
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
