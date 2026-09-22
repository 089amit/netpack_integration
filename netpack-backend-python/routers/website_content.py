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
    tickerItems: Optional[List[str]] = None

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
        "contactPhone": row.contactPhone or "015339942",
        "contactEmail": row.contactEmail or "admin@netpacklogistic.com",
        "contactAddress": row.contactAddress or "Teku Road, Ward No. 15, Kathmandu, Nepal",
        "businessHours": row.businessHours or "10:00 am - 5:00 pm (Sun - Fri)",
        "tickerItems": ticker_list,
        "updatedAt": row.updatedAt.isoformat() if row.updatedAt else None
    }

@router.get("")
@router.get("/")
def get_website_content(db: Session = Depends(get_db)):
    content = db.query(WebsiteContent).first()
    if not content:
        content = WebsiteContent()
        db.add(content)
        db.commit()
        db.refresh(content)
    return _format_content(content)

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
    if payload.tickerItems is not None:
        content.tickerItems = json.dumps(payload.tickerItems)

    db.commit()
    db.refresh(content)
    return {
        "message": "Website content updated successfully",
        "content": _format_content(content)
    }
