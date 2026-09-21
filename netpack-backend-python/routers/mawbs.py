from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
from models.mawb import MAWB, Agent
from models.enquiry import Enquiry
from models.shipment import Shipment
from schemas.mawb import MawbCreateRequest, MawbUpdateRequest, LinkEnquiryToMawbRequest

router = APIRouter(prefix="/api/mawbs", tags=["MAWB"])

def format_mawb(m: MAWB):
    return {
        "id": m.id,
        "mawbNumber": m.mawbNumber,
        "departureDate": m.departureDate.isoformat() if m.departureDate else None,
        "airlineName": m.airlineName,
        "destination": m.destination,
        "agentId": m.agentId,
        "agent": {"id": m.agent.id, "name": m.agent.name, "code": m.agent.code} if m.agent else None,
        "dateOfArrival": m.dateOfArrival.isoformat() if m.dateOfArrival else None,
        "flightNumber": m.flightNumber,
        "timeOfArrival": m.timeOfArrival,
        "documentPath": m.documentPath,
        "documentUrl": m.documentPath or "",
        "hasShipment": bool(m.shipments and len(m.shipments) > 0),
        "createdAt": m.createdAt.isoformat() if m.createdAt else None,
        "updatedAt": m.updatedAt.isoformat() if m.updatedAt else None,
        "enquiryCount": len(m.enquiry) if m.enquiry else 0
    }

@router.get("")
@router.get("/")
@router.get("/getallmawb")
def get_all_mawbs(
    page: int = 1,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(MAWB)
    if search:
        s = f"%{search}%"
        q = q.filter((MAWB.mawbNumber.ilike(s)) | (MAWB.airlineName.ilike(s)) | (MAWB.destination.ilike(s)))
    total = q.count()
    mawbs = q.order_by(MAWB.createdAt.desc()).all()
    res = [format_mawb(m) for m in mawbs]
    return {
        "data": res,
        "pagination": {
            "page": page,
            "limit": limit,
            "totalItems": total,
            "totalPages": max(1, (total + limit - 1) // limit) if limit > 0 else 1,
            "hasNextPage": False,
            "hasPreviousPage": False
        }
    }

@router.get("/get/{id}")
def get_mawb_by_id(id: int, db: Session = Depends(get_db)):
    m = db.query(MAWB).filter(MAWB.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="MAWB not found")
    return format_mawb(m)

@router.post("")
@router.post("/")
def create_mawb(
    mawbNumber: str = Form(...),
    airlineName: Optional[str] = Form(None),
    destination: Optional[str] = Form(None),
    departureDate: Optional[str] = Form(None),
    agentId: Optional[int] = Form(None),
    flightNumber: Optional[str] = Form(None),
    timeOfArrival: Optional[str] = Form(None),
    dateOfArrival: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    existing = db.query(MAWB).filter(MAWB.mawbNumber == mawbNumber).first()
    if existing:
        raise HTTPException(status_code=400, detail="MAWB with this number already exists")

    doc_path = None
    if image:
        import config
        save_path = config.UPLOADS_DIR / f"mawb_{mawbNumber}_{image.filename}"
        with open(save_path, "wb") as f:
            f.write(image.file.read())
        doc_path = f"/uploads/{save_path.name}"

    dep_dt = datetime.utcnow()
    if departureDate:
        try: dep_dt = datetime.fromisoformat(departureDate.replace("Z", "+00:00"))
        except Exception: pass

    arr_dt = None
    if dateOfArrival:
        try: arr_dt = datetime.fromisoformat(dateOfArrival.replace("Z", "+00:00"))
        except Exception: pass

    m = MAWB(
        mawbNumber=mawbNumber,
        airlineName=airlineName,
        destination=destination,
        departureDate=dep_dt,
        agentId=agentId,
        flightNumber=flightNumber,
        timeOfArrival=timeOfArrival,
        dateOfArrival=arr_dt,
        documentPath=doc_path
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return format_mawb(m)

@router.put("/update/{id}")
def update_mawb(
    id: int,
    mawbNumber: Optional[str] = Form(None),
    airlineName: Optional[str] = Form(None),
    destination: Optional[str] = Form(None),
    departureDate: Optional[str] = Form(None),
    agentId: Optional[int] = Form(None),
    flightNumber: Optional[str] = Form(None),
    timeOfArrival: Optional[str] = Form(None),
    dateOfArrival: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    m = db.query(MAWB).filter(MAWB.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="MAWB not found")

    if mawbNumber: m.mawbNumber = mawbNumber
    if airlineName: m.airlineName = airlineName
    if destination: m.destination = destination
    if agentId: m.agentId = agentId
    if flightNumber: m.flightNumber = flightNumber
    if timeOfArrival: m.timeOfArrival = timeOfArrival

    if departureDate:
        try: m.departureDate = datetime.fromisoformat(departureDate.replace("Z", "+00:00"))
        except Exception: pass
    if dateOfArrival:
        try: m.dateOfArrival = datetime.fromisoformat(dateOfArrival.replace("Z", "+00:00"))
        except Exception: pass

    if image:
        import config
        save_path = config.UPLOADS_DIR / f"mawb_{m.mawbNumber}_{image.filename}"
        with open(save_path, "wb") as f:
            f.write(image.file.read())
        m.documentPath = f"/uploads/{save_path.name}"

    db.commit()
    db.refresh(m)
    return format_mawb(m)

@router.delete("/delete/{id}")
def delete_mawb(id: int, db: Session = Depends(get_db)):
    m = db.query(MAWB).filter(MAWB.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="MAWB not found")
    db.delete(m)
    db.commit()
    return {"message": "MAWB deleted successfully"}

@router.post("/linkenquiry")
def link_enquiries_to_mawb(payload: LinkEnquiryToMawbRequest, db: Session = Depends(get_db)):
    mawb = None
    try:
        mid = int(payload.mawbId)
        mawb = db.query(MAWB).filter(MAWB.id == mid).first()
    except (ValueError, TypeError):
        pass

    if not mawb:
        mawb = db.query(MAWB).filter(MAWB.mawbNumber == str(payload.mawbId)).first()

    if not mawb:
        raise HTTPException(status_code=404, detail="MAWB not found")

    linked_count = 0

    if payload.shipmentIds:
        for raw_sid in payload.shipmentIds:
            try:
                sid = int(raw_sid)
                s = db.query(Shipment).filter(Shipment.id == sid).first()
                if s:
                    s.mawbId = mawb.id
                    if s.enquiry:
                        s.enquiry.mawbId = mawb.id
                    if s.status in ("SHIPMENT_CREATED", "PENDING", "ENQUIRY_GENERATED"):
                        s.status = "IN_TRANSIT"
                        if s.enquiry:
                            s.enquiry.status = "IN_TRANSIT"
                    linked_count += 1
            except (ValueError, TypeError):
                continue

    if payload.enquiryIds:
        for raw_eid in payload.enquiryIds:
            try:
                eid = int(raw_eid)
                enq = db.query(Enquiry).filter(Enquiry.id == eid).first()
                if enq:
                    enq.mawbId = mawb.id
                    for s in enq.shipments:
                        s.mawbId = mawb.id
                        if s.status in ("SHIPMENT_CREATED", "PENDING", "ENQUIRY_GENERATED"):
                            s.status = "IN_TRANSIT"
                    if enq.status in ("SHIPMENT_CREATED", "PENDING", "ENQUIRY_GENERATED"):
                        enq.status = "IN_TRANSIT"
                    linked_count += 1
            except (ValueError, TypeError):
                continue

    db.commit()
    return {"message": f"{linked_count} item(s) linked to MAWB {mawb.mawbNumber}"}

@router.get("/getEnquiriesByMawb")
def get_enquiries_by_mawb(mawbId: int, db: Session = Depends(get_db)):
    enquiries = db.query(Enquiry).filter(Enquiry.mawbId == mawbId).all()
    return enquiries
