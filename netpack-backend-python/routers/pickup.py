import os
import json
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

import config
from database import get_db
from models.enquiry import Enquiry, Box, PickupLocationEnquiry
from models.shipment import Shipment, TrackingEvent
from models.user import User, Role
from schemas.auth import RiderLoginRequest, TokenValidationRequest
from services.auth_service import verify_password, create_access_token, decode_token


router = APIRouter(prefix="/api/pickups", tags=["Pickups"])

# Ensure uploads directory for pickup proofs exists
PICKUP_PROOFS_DIR = config.UPLOADS_DIR / "pickup_proofs"
PICKUP_PROOFS_DIR.mkdir(parents=True, exist_ok=True)


def format_pickup_item(e: Enquiry) -> Dict[str, Any]:
    shipment = e.shipments[0] if e.shipments else None
    staff_name = e.pickupStaff.fullName if e.pickupStaff else (e.pickupStaff.email if e.pickupStaff else None)

    # Compile sender address string
    address_parts = [
        e.senderAddressLine1,
        e.senderAddressLine2,
        e.senderCity,
        e.senderLocation,
        e.senderPostcode
    ]
    sender_address_full = ", ".join([p for p in address_parts if p])

    commodity = None
    if getattr(e, "items", None) and len(e.items) > 0:
        commodity = e.items[0].description
    elif getattr(e, "boxes", None) and len(e.boxes) > 0:
        commodity = e.boxes[0].dimensions

    pickup_address_override = None
    pickup_phone_override = None
    preferred_time = None
    if getattr(e, "pickupLocations", None) and len(e.pickupLocations) > 0:
        pl = e.pickupLocations[0]
        if pl.location:
            pickup_address_override = pl.location
        if pl.phoneNumber:
            pickup_phone_override = pl.phoneNumber
        if pl.note:
            preferred_time = pl.note

    return {
        "id": e.id,
        "trackingNumber": e.trackingNumber,
        "status": shipment.status if shipment else e.status,
        "customerId": e.customerId,
        "customerName": e.customer.name if e.customer else None,
        "customerPhone": e.customer.phone if e.customer else None,
        "senderName": e.senderName or (e.customer.name if e.customer else "Sender"),
        "senderPhone": e.senderPhone or (e.customer.phone if e.customer else None),
        "senderEmail": e.senderEmail or (e.customer.email if e.customer else None),
        "senderAddress": sender_address_full or "Address upon request",
        "senderCity": e.senderCity or e.senderLocation,
        "pickupAddress": pickup_address_override or sender_address_full or "Address upon request",
        "pickupPhone": pickup_phone_override or e.senderPhone or (e.customer.phone if e.customer else None),
        "preferredTime": preferred_time,
        "commodity": commodity or "General Consignment",
        "pickupRequired": bool(getattr(e, "pickupRequired", True)),
        "receiverName": e.receiverName,
        "receiverPhone": e.receiverTelephone,
        "receiverCountry": e.receiverCountry or (e.country.name if e.country else None),
        "receiverCity": e.receiverCity,
        "noOfBox": e.noOfBox or (len(e.boxes) if e.boxes else 1),
        "weight": e.weight,
        "volumetricWeight": e.volumetricWeight,
        "chargeableWeight": e.chargeableWeight,
        "weightProofImageUrl": ([u.strip() for u in (e.weightProofImageUrl or "").split(",") if u.strip()] or [None])[0],
        "weightProofImages": [u.strip() for u in (e.weightProofImageUrl or "").split(",") if u.strip()],
        "pickedUpAt": e.pickedUpAt.isoformat() if e.pickedUpAt else None,
        "pickedUpBy": e.pickedUpBy,
        "pickupStaffName": staff_name,
        "pickupNotes": e.pickupNotes,
        "createdAt": e.createdAt.isoformat() if e.createdAt else None,
        "updatedAt": e.updatedAt.isoformat() if e.updatedAt else None,
        "hawbNumber": shipment.hawbno if shipment else None,
        "shipmentId": shipment.id if shipment else None,
        "boxes": [
            {
                "id": b.id,
                "trackingNumber": b.trackingNumber,
                "weight": b.weight,
                "length": b.length,
                "breadth": b.breadth,
                "height": b.height,
                "multiplier": b.multiplier or 1.0,
                "quantity": b.quantity or 1,
                "dimensions": b.dimensions or f"{b.length or 0}x{b.breadth or 0}x{b.height or 0}"
            }
            for b in e.boxes
        ],
        "pickupLocations": [
            {
                "id": pl.id,
                "location": pl.location,
                "phoneNumber": pl.phoneNumber,
                "note": pl.note
            }
            for pl in e.pickupLocations
        ]
    }


class PickupStatusUpdate(BaseModel):
    status: str
    riderName: Optional[str] = None
    riderNotes: Optional[str] = None


@router.post("/auth/login")
def rider_login(payload: RiderLoginRequest, db: Session = Depends(get_db)):
    ident = payload.identifier.strip()
    if not ident or not payload.password:
        raise HTTPException(status_code=400, detail="Rider ID/Email and password are required")

    # Match by email (case-insensitive), username (case-insensitive), or exact phone
    user = db.query(User).filter(
        (User.email.ilike(ident)) |
        (User.username.ilike(ident)) |
        (User.phoneNumber == ident)
    ).first()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid Rider ID/Email or password")

    if not user.isActive:
        raise HTTPException(status_code=403, detail="Rider account is deactivated. Please contact NetPack dispatch.")

    role_name = (user.role.name if user.role else "").upper()
    if role_name not in ["PICKUP", "ADMIN", "OPERATION"]:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: Account role ({role_name or 'NONE'}) does not have Pickup Rider privileges."
        )

    token_data = {
        "userId": user.id,
        "email": user.email,
        "fullName": user.fullName,
        "username": user.username,
        "role": role_name,
        "roleId": user.roleId,
        "type": "rider"
    }
    token = create_access_token(token_data, is_admin=True)

    return {
        "message": "Rider login successful",
        "token": token,
        "rider": {
            "id": user.id,
            "name": user.fullName or user.username or user.email.split("@")[0],
            "email": user.email,
            "username": user.username,
            "phone": user.phoneNumber,
            "role": role_name
        }
    }


@router.post("/auth/validate-token")
def validate_rider_token(payload: TokenValidationRequest, db: Session = Depends(get_db)):
    token = payload.token
    if not token:
        return {"valid": False, "message": "No token provided"}

    decoded = decode_token(token, is_admin=True)
    if not decoded:
        return {"valid": False, "message": "Session expired or invalid"}

    user_id = decoded.get("userId") or decoded.get("id")
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if not user or not user.isActive:
        return {"valid": False, "message": "User not found or deactivated"}

    role_name = (user.role.name if user.role else "").upper()
    return {
        "valid": True,
        "rider": {
            "id": user.id,
            "name": user.fullName or user.username or user.email.split("@")[0],
            "email": user.email,
            "username": user.username,
            "phone": user.phoneNumber,
            "role": role_name
        }
    }


@router.get("/live-alerts")
def get_live_alerts(
    since_id: Optional[int] = Query(None),
    since_time: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Real-time pickup alerts polling endpoint for the Rider PWA.
    Returns newly created/pending pickups matching criteria.
    """
    query = db.query(Enquiry).filter(
        Enquiry.status.in_(["ENQUIRY_GENERATED", "PENDING", "ASSIGNED_FOR_PICKUP"]),
        ~Enquiry.shipments.any()
    )

    if since_id is not None:
        query = query.filter(Enquiry.id > since_id)
    elif since_time:
        try:
            dt = datetime.fromisoformat(since_time.replace("Z", "+00:00"))
            query = query.filter(Enquiry.createdAt > dt)
        except Exception:
            pass

    new_pickups = query.order_by(Enquiry.id.desc()).limit(25).all()
    max_id = db.query(func.max(Enquiry.id)).scalar() or 0

    return {
        "latestId": max_id,
        "serverTime": datetime.utcnow().isoformat(),
        "hasNew": len(new_pickups) > 0,
        "count": len(new_pickups),
        "newPickups": [format_pickup_item(e) for e in new_pickups]
    }


@router.post("/test-alert")
def trigger_test_alert(db: Session = Depends(get_db)):
    """
    Triggers a simulated test pickup alert so riders can verify push notifications,
    vibration, and the audio chime on their device.
    """
    import random
    sample_locations = [
        ("Thamel Marg, Kathmandu", "+977 9841234567", "Pashmina & Woolen Shawls"),
        ("New Road, Kathmandu", "+977 9801987654", "Handicrafts & Wooden Carvings"),
        ("Boudha Stupa Gate, Kathmandu", "+977 9812345678", "Tibetan Incense & Himalayan Tea"),
        ("Patan Durbar Area, Lalitpur", "+977 9860112233", "Handmade Silver Jewelry & Statues"),
        ("Lakeside Ward 6, Pokhara", "+977 9856012345", "Himalayan Organic Coffee & Spices"),
    ]
    loc, ph, comm = random.choice(sample_locations)
    fake_id = 999000 + random.randint(100, 999)

    return {
        "isTest": True,
        "message": "Test pickup alert generated successfully",
        "pickup": {
            "id": fake_id,
            "trackingNumber": f"TEST-NP-{random.randint(1000, 9999)}",
            "status": "ENQUIRY_GENERATED",
            "senderName": "Simulated Test Customer",
            "senderPhone": ph,
            "senderAddress": loc,
            "pickupAddress": loc,
            "pickupPhone": ph,
            "senderCity": "Kathmandu",
            "commodity": comm,
            "weight": round(random.uniform(2.5, 18.0), 1),
            "noOfBox": random.randint(1, 4),
            "receiverName": "International Consignee",
            "receiverCountry": "United Kingdom",
            "receiverCity": "London",
            "createdAt": datetime.utcnow().isoformat(),
            "pickupNotes": "Please call 10 minutes before arrival at main gate.",
            "preferredTime": "Immediate Dispatch",
            "pickupRequired": True
        }
    }


@router.patch("/{id}/status")
def update_pickup_status(id: int, payload: PickupStatusUpdate, db: Session = Depends(get_db)):
    """
    Updates pickup status (e.g. ASSIGNED_FOR_PICKUP / IN_ROUTE / PENDING) and logs rider notes.
    """
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Pickup task / Enquiry not found")

    e.status = payload.status
    if payload.riderNotes:
        tag = f"[Rider {payload.riderName or 'Staff'}]: {payload.riderNotes}"
        e.pickupNotes = f"{e.pickupNotes}\n{tag}".strip() if e.pickupNotes else tag

    db.commit()
    db.refresh(e)
    return {
        "message": f"Pickup status updated to {payload.status}",
        "pickup": format_pickup_item(e)
    }


@router.get("/stats")
def get_pickup_stats(db: Session = Depends(get_db)):
    """
    Returns quick operational statistics for the pickup dashboard.
    """
    pending_statuses = ["ENQUIRY_GENERATED", "PENDING", "ASSIGNED_FOR_PICKUP"]
    pending_count = db.query(Enquiry).filter(
        Enquiry.status.in_(pending_statuses),
        ~Enquiry.shipments.any()
    ).count()
    picked_up_count = db.query(Enquiry).filter(
        (Enquiry.status.in_(["PICKED_UP", "PACKED", "SHIPMENT_CREATED", "IN_TRANSIT", "ARRIVED_AT_HUB", "CARRIER_SCANNED", "DELIVERED"])) |
        (Enquiry.weightProofImageUrl != None) |
        (Enquiry.shipments.any())
    ).count()

    today_start = datetime.combine(date.today(), datetime.min.time())
    today_pickups = db.query(Enquiry).filter(
        Enquiry.pickedUpAt >= today_start
    ).all()

    total_weight_today = sum([p.weight or 0.0 for p in today_pickups])
    total_boxes_today = sum([p.noOfBox or 1 for p in today_pickups])

    return {
        "pendingCount": pending_count,
        "pickedUpCount": picked_up_count,
        "totalWeightToday": round(total_weight_today, 2),
        "totalBoxesToday": total_boxes_today
    }


@router.get("")
@router.get("/")
def get_pickups(
    status: Optional[str] = Query("ALL"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1),
    db: Session = Depends(get_db)
):
    """
    Returns list of enquiries for pickup operations with filterable status and search.
    """
    query = db.query(Enquiry)

    status_filter = (status or "ALL").upper()
    if status_filter == "PENDING":
        query = query.filter(
            Enquiry.status.in_(["ENQUIRY_GENERATED", "PENDING", "ASSIGNED_FOR_PICKUP"]),
            ~Enquiry.shipments.any()
        )
    elif status_filter == "PICKED_UP":
        query = query.filter(
            (Enquiry.status.in_(["PICKED_UP", "PACKED", "SHIPMENT_CREATED", "IN_TRANSIT", "ARRIVED_AT_HUB", "CARRIER_SCANNED", "DELIVERED"])) |
            (Enquiry.weightProofImageUrl != None) |
            (Enquiry.shipments.any())
        )
    elif status_filter not in ("ALL", ""):
        query = query.filter(Enquiry.status == status_filter)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Enquiry.trackingNumber.ilike(s)) |
            (Enquiry.senderName.ilike(s)) |
            (Enquiry.senderPhone.ilike(s)) |
            (Enquiry.senderCity.ilike(s)) |
            (Enquiry.receiverName.ilike(s))
        )

    total_records = query.count()
    total_pages = max(1, (total_records + limit - 1) // limit)
    enquiries = query.order_by(Enquiry.createdAt.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "pickups": [format_pickup_item(e) for e in enquiries],
        "pagination": {
            "page": page,
            "limit": limit,
            "totalRecords": total_records,
            "totalPages": total_pages
        }
    }


@router.get("/{id}")
def get_pickup_by_id(id: int, db: Session = Depends(get_db)):
    """
    Returns single pickup task details.
    """
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Pickup task / Enquiry not found")
    return format_pickup_item(e)


@router.post("/{id}/pickup-and-weigh")
async def pickup_and_weigh(
    id: int,
    actualWeight: float = Form(...),
    boxesJson: Optional[str] = Form(None),
    pickupNotes: Optional[str] = Form(None),
    scaleImage: Optional[UploadFile] = File(None),
    scaleImages: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    """
    Marks an enquiry as PICKED_UP, records actual warehouse weight,
    updates box dimensions, uploads weighing scale and box proof photos,
    and creates a TrackingEvent milestone.
    """
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    # 1. Handle scale & box proof image upload(s)
    saved_urls = []
    if e.weightProofImageUrl:
        saved_urls.extend([u.strip() for u in e.weightProofImageUrl.split(",") if u.strip()])

    all_upload_files: List[UploadFile] = []
    if scaleImages:
        for f in scaleImages:
            if f and f.filename:
                all_upload_files.append(f)
    if scaleImage and scaleImage.filename:
        all_upload_files.append(scaleImage)

    for idx, img_file in enumerate(all_upload_files):
        ext = os.path.splitext(img_file.filename)[1].lower()
        if not ext or ext not in [".jpg", ".jpeg", ".png", ".webp", ".heic", ".bmp"]:
            ext = ".jpg"
        unique_name = f"scale_proof_{id}_{uuid.uuid4().hex[:8]}_{idx}{ext}"
        target_path = PICKUP_PROOFS_DIR / unique_name

        try:
            content = await img_file.read()
            with open(target_path, "wb") as f:
                f.write(content)
            saved_urls.append(f"/uploads/pickup_proofs/{unique_name}")
        except Exception as err:
            raise HTTPException(status_code=500, detail=f"Failed saving weighing scale image: {err}")

    # Deduplicate while preserving order
    deduped_urls = []
    for u in saved_urls:
        if u not in deduped_urls:
            deduped_urls.append(u)

    scale_image_urls_str = ",".join(deduped_urls) if deduped_urls else None

    # 2. Parse & Update Boxes and compute Volumetric Weight
    total_volumetric_weight = 0.0
    parsed_boxes = []
    if boxesJson:
        try:
            parsed_boxes = json.loads(boxesJson)
        except Exception:
            parsed_boxes = []

    if parsed_boxes:
        # Clear existing boxes if replacing with new verified box details
        db.query(Box).filter(Box.enquiryId == e.id).delete()
        for idx, b_data in enumerate(parsed_boxes, 1):
            length = float(b_data.get("length") or 0.0)
            breadth = float(b_data.get("breadth") or b_data.get("width") or 0.0)
            height = float(b_data.get("height") or 0.0)
            box_weight = float(b_data.get("weight") or (actualWeight / len(parsed_boxes)))
            multiplier = float(b_data.get("multiplier") or 1.0)
            qty = int(b_data.get("quantity") or 1)

            # Volumetric formula: (L x W x H in cm) / 5000 * qty
            vol_wt = ((length * breadth * height) / 5000.0) * qty * multiplier
            total_volumetric_weight += vol_wt

            box_rec = Box(
                enquiryId=e.id,
                trackingNumber=b_data.get("trackingNumber") or f"{e.trackingNumber}-{idx}",
                weight=box_weight,
                dimensions=f"{length}x{breadth}x{height}",
                length=length,
                breadth=breadth,
                height=height,
                multiplier=multiplier,
                quantity=qty
            )
            db.add(box_rec)

        e.noOfBox = len(parsed_boxes)
    else:
        # Use existing boxes or default 1 box
        if e.boxes:
            for b in e.boxes:
                vol_wt = (((b.length or 0) * (b.breadth or 0) * (b.height or 0)) / 5000.0) * (b.quantity or 1)
                total_volumetric_weight += vol_wt
        else:
            total_volumetric_weight = (30.0 * 20.0 * 20.0 / 5000.0)

    # 3. Update Enquiry details
    e.status = "PICKED_UP"
    e.weight = round(actualWeight, 2)
    e.volumetricWeight = round(total_volumetric_weight, 2)
    e.chargeableWeight = round(max(actualWeight, total_volumetric_weight), 2)
    if scale_image_urls_str:
        e.weightProofImageUrl = scale_image_urls_str
    if pickupNotes is not None:
        e.pickupNotes = pickupNotes
    e.pickedUpAt = datetime.utcnow()

    # 4. Also update linked Shipment status if already created
    if e.shipments:
        for s in e.shipments:
            s.status = "PICKED_UP"

    # 5. Add a TrackingEvent milestone
    tracking_num = e.trackingNumber or f"ENQ-{e.id}"
    shipment_id = e.shipments[0].id if e.shipments else None
    
    event = TrackingEvent(
        shipmentId=shipment_id,
        trackingNumber=tracking_num,
        status="PICKED_UP",
        location="NetPack Central Warehouse, Kathmandu",
        activity=f"Cargo picked up and verified at NetPack warehouse. Verified Weight: {actualWeight} kg ({e.noOfBox} box{'es' if (e.noOfBox or 1) > 1 else ''}).",
        country="Nepal",
        checkpointTime=datetime.utcnow(),
        source="WAREHOUSE_PICKUP"
    )
    db.add(event)

    db.commit()
    db.refresh(e)

    return {
        "message": "Cargo picked up and warehouse weight verified successfully",
        "pickup": format_pickup_item(e)
    }
