from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models.shipment import Shipment
from models.enquiry import Enquiry
from models.mawb import MAWB

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    # Calculate counts
    pending_count = db.query(Enquiry).filter(
        Enquiry.status.in_(["ENQUIRY_GENERATED", "PENDING", "SHIPMENT_CREATED", "PICKED_UP"])
    ).count()

    in_transit_count = db.query(Enquiry).filter(
        Enquiry.status.in_(["IN_TRANSIT", "ARRIVED_AT_HUB"])
    ).count()

    delivered_count = db.query(Enquiry).filter(
        Enquiry.status == "DELIVERED"
    ).count()

    # Active MAWBs
    now = datetime.utcnow()
    start_today = datetime(now.year, now.month, now.day)
    next_week = now + timedelta(days=7)
    active_mawbs = db.query(MAWB).filter(
        MAWB.departureDate >= start_today,
        MAWB.departureDate <= next_week
    ).count()

    if active_mawbs == 0:
        active_mawbs = db.query(MAWB).count()

    return [
        {"title": "Active MAWB", "value": active_mawbs},
        {"title": "Pending", "value": pending_count},
        {"title": "In-Transit", "value": in_transit_count},
        {"title": "Delivered", "value": delivered_count}
    ]

@router.get("/monthly-shipments")
def get_monthly_shipments(db: Session = Depends(get_db)):
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_year = datetime.utcnow().year

    data = []
    for idx, m in enumerate(months, 1):
        count = db.query(Shipment).filter(
            Shipment.createdAt >= datetime(current_year, idx, 1),
            Shipment.createdAt < (datetime(current_year, idx + 1, 1) if idx < 12 else datetime(current_year + 1, 1, 1))
        ).count()
        data.append({"month": m, "total": count})

    return data

@router.get("/mobile")
def get_mobile_analytics(db: Session = Depends(get_db)):
    total_enquiries = db.query(Enquiry).count()
    total_shipments = db.query(Shipment).count()
    return {
        "totalEnquiries": total_enquiries,
        "totalShipments": total_shipments
    }
