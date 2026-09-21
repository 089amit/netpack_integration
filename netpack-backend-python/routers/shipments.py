from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from models.shipment import Shipment, ShipmentPickUpLocation, TransitPoint, TrackingEvent
from models.enquiry import Enquiry
from models.customer import Customer
from models.mawb import Agent, MAWB, ForwardingCompany, ForwardingService
from models.location import Country
from schemas.shipment import (
    BulkShipmentsFromEnquiriesRequest,
    BulkStatusChangeRequest,
    BatchAddNoteRequest,
    ShipmentStatusUpdateRequest,
    AssignAgentRequest,
    ShipmentUpdateRequest
)
from services.hawb_service import compute_next_hawb_for_agent

router = APIRouter(prefix="/api/shipments", tags=["Shipments"])

def format_shipment_response(s: Shipment, db: Session = None) -> Dict[str, Any]:
    # 1. Destination Country
    dest_country_name = ""
    country_id = s.countryId
    if s.country and s.country.name:
        dest_country_name = s.country.name
    elif s.enquiry and s.enquiry.country and s.enquiry.country.name:
        dest_country_name = s.enquiry.country.name
        if not country_id:
            country_id = s.enquiry.country.id
    elif s.enquiry and s.enquiry.destinationLocation:
        dest_country_name = s.enquiry.destinationLocation
    elif country_id and db:
        c = db.query(Country).filter(Country.id == country_id).first()
        if c:
            dest_country_name = c.name

    # 2. Customer / Shipper Information
    cust_name = ""
    cust_phone = ""
    cust_email = ""
    cust_org = ""
    if s.customer:
        cust_name = s.customer.name or ""
        cust_phone = s.customer.phone or ""
        cust_email = s.customer.email or ""
        cust_org = getattr(s.customer, 'organizationName', '') or ""
    elif s.enquiry and s.enquiry.customer:
        cust_name = s.enquiry.customer.name or ""
        cust_phone = s.enquiry.customer.phone or ""
        cust_email = s.enquiry.customer.email or ""
        cust_org = getattr(s.enquiry.customer, 'organizationName', '') or ""

    sender_name = (s.enquiry.senderName if (s.enquiry and s.enquiry.senderName) else cust_name) or ""
    sender_phone = (s.enquiry.senderPhone if (s.enquiry and s.enquiry.senderPhone) else cust_phone) or ""
    customer_phone = cust_phone or sender_phone or ""
    sender_org = cust_org or (getattr(s.enquiry, 'senderOrganization', '') if s.enquiry else "") or ""

    # 3. Receiver Information
    receiver_name = (s.enquiry.receiverName if (s.enquiry and s.enquiry.receiverName) else "") or ""
    receiver_phone = ((getattr(s.enquiry, 'receiverTelephone', None) or getattr(s.enquiry, 'receiverPhone', None)) if s.enquiry else "") or ""

    # 4. Forwarding Company & Service
    fc_name = (s.forwardingCompany.name if s.forwardingCompany else "") or ""
    service_name = (s.service.name if s.service else "") or ""

    # 5. MAWB Information
    mawb_number = (s.mawb.mawbNumber if s.mawb else "") or ""
    dep_date = s.mawb.departureDate.isoformat() if (s.mawb and s.mawb.departureDate) else None
    airline_name = (s.mawb.airlineName if s.mawb else "") or ""
    flight_num = (s.mawb.flightNumber if s.mawb else "") or ""

    mawb_details = {
        "id": s.mawb.id,
        "mawbNumber": mawb_number,
        "airlineName": airline_name,
        "flightNumber": flight_num,
        "departureDate": dep_date
    } if s.mawb else None

    # 6. Overseas Agent Information
    agent_code = s.agent or ""
    agent_id = 0
    if s.agent and db:
        agent_obj = db.query(Agent).filter((Agent.code == s.agent) | (Agent.name == s.agent)).first()
        if agent_obj:
            agent_id = agent_obj.id
            agent_code = agent_obj.code

    # 7. Boxes & Items
    raw_boxes = s.boxes if (s.boxes and len(s.boxes) > 0) else (s.enquiry.boxes if (s.enquiry and s.enquiry.boxes) else [])
    formatted_boxes = []
    for b in raw_boxes:
        box_items = []
        if b.items:
            for bi in b.items:
                enq_item = getattr(bi, 'enquiryItem', None)
                box_items.append({
                    "id": bi.id,
                    "quantity": bi.quantity,
                    "enquiryItemId": bi.enquiryItemId,
                    "enquiryItem": {
                        "id": enq_item.id,
                        "description": enq_item.description,
                        "weight": enq_item.weight,
                        "unitPrice": enq_item.unitPrice
                    } if enq_item else None
                })
        formatted_boxes.append({
            "id": b.id,
            "trackingNumber": b.trackingNumber or (s.enquiry.trackingNumber if s.enquiry else ""),
            "weight": b.weight or 0.0,
            "dimensions": b.dimensions or "",
            "length": b.length or 0.0,
            "breadth": b.breadth or 0.0,
            "height": b.height or 0.0,
            "quantity": b.quantity or 1,
            "value": b.value or 0.0,
            "multiplier": b.multiplier or 1.0,
            "items": box_items
        })

    # 8. Pickup Locations
    pickup_locs = []
    if s.pickupLocations and len(s.pickupLocations) > 0:
        for pl in s.pickupLocations:
            pickup_locs.append({"id": pl.id, "location": pl.location, "phoneNumber": getattr(pl, 'phoneNumber', '') or ""})
    elif s.enquiry and s.enquiry.pickupLocations and len(s.enquiry.pickupLocations) > 0:
        for pl in s.enquiry.pickupLocations:
            pickup_locs.append({"id": pl.id, "location": pl.location, "phoneNumber": getattr(pl, 'phoneNumber', '') or ""})

    # 9. Enquiry Details
    enquiry_details = None
    if s.enquiry:
        enquiry_items = []
        if s.enquiry.items:
            for item in s.enquiry.items:
                enquiry_items.append({
                    "id": item.id,
                    "description": item.description or "",
                    "weight": item.weight or 0.0,
                    "value": item.value or 0.0,
                    "quantity": item.quantity or 1,
                    "unitPrice": item.unitPrice or 0.0,
                    "hsCode": item.hsCode or "",
                    "totalValue": item.totalValue or 0.0
                })
        enquiry_details = {
            "id": s.enquiry.id,
            "trackingNumber": s.enquiry.trackingNumber or "",
            "senderName": sender_name,
            "senderPhone": sender_phone,
            "receiverName": receiver_name,
            "receiverTelephone": receiver_phone,
            "destinationLocation": s.enquiry.destinationLocation or dest_country_name,
            "status": s.enquiry.status,
            "items": enquiry_items,
            "boxes": formatted_boxes,
            "customer": {
                "id": s.enquiry.customer.id,
                "name": s.enquiry.customer.name,
                "organizationName": cust_org
            } if s.enquiry.customer else None
        }

    return {
        "id": s.id,
        "status": s.status,
        "enquiryId": s.enquiryId,
        "customerId": s.customerId,
        "mawbId": s.mawbId,
        "forwardingCompanyId": s.forwardingCompanyId,
        "serviceId": s.serviceId,
        "countryId": country_id,
        "agent": s.agent or "",
        "agentCode": agent_code,
        "agentId": agent_id,
        "forwardingNumber": s.forwardingNumber or "",
        "agentShipmentNumber": s.agentShipmentNumber,
        "hawbno": s.hawbno or "",
        "hawbNumber": s.hawbno or "",
        "note": s.note or "",
        "trackingMode": getattr(s, "trackingMode", "MANUAL") or "MANUAL",
        "createdAt": s.createdAt.isoformat() if s.createdAt else None,
        "updatedAt": s.updatedAt.isoformat() if s.updatedAt else None,

        # Top-level flattened properties for table & details drawer:
        "customerName": cust_name,
        "customerPhone": customer_phone,
        "customerEmail": cust_email,
        "senderName": sender_name,
        "senderPhone": sender_phone,
        "senderOrganization": sender_org,
        "receiverName": receiver_name,
        "reciverName": receiver_name,
        "destinationCountryName": dest_country_name,
        "forwardingCompanyName": fc_name,
        "serviceName": service_name,
        "mawbNumber": mawb_number,

        # Nested models & alias keys:
        "customer": {
            "id": s.customer.id if s.customer else (s.enquiry.customer.id if (s.enquiry and s.enquiry.customer) else None),
            "name": cust_name,
            "phone": customer_phone,
            "email": cust_email,
            "organizationName": cust_org
        } if (s.customer or (s.enquiry and s.enquiry.customer)) else None,
        "country": {
            "id": country_id,
            "name": dest_country_name
        } if country_id else None,
        "mawb": mawb_details,
        "mawbDetails": mawb_details,
        "forwardingCompany": {
            "id": s.forwardingCompany.id,
            "name": fc_name
        } if s.forwardingCompany else None,
        "service": {
            "id": s.service.id,
            "name": service_name
        } if s.service else None,
        "enquiry": enquiry_details,
        "enquiryDetails": enquiry_details,
        "boxes": formatted_boxes,
        "boxDetails": formatted_boxes,
        "pickupLocations": pickup_locs,
        "transitPoints": [
            {
                "id": tp.id,
                "location": tp.location,
                "country": tp.country.name if tp.country else None,
                "timestamp": tp.timestamp.isoformat() if tp.timestamp else None
            } for tp in (s.transitPoints or [])
        ]
    }

@router.get("")
@router.get("/")
def get_all_shipments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Shipment)

    if status:
        status_list = [st.strip() for st in status.split(",") if st.strip()]
        if len(status_list) == 1:
            query = query.filter(Shipment.status == status_list[0])
        elif len(status_list) > 1:
            query = query.filter(Shipment.status.in_(status_list))

    if search:
        s = f"%{search}%"
        query = query.join(Shipment.enquiry, isouter=True).filter(
            (Shipment.hawbno.ilike(s)) |
            (Shipment.forwardingNumber.ilike(s)) |
            (Shipment.agent.ilike(s)) |
            (Enquiry.senderName.ilike(s)) |
            (Enquiry.receiverName.ilike(s))
        )

    total_records = query.count()
    total_pages = (total_records + limit - 1) // limit if limit > 0 else 1
    shipments = query.order_by(Shipment.createdAt.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "pagination": {
            "page": page,
            "limit": limit,
            "totalItems": total_records,
            "totalRecords": total_records,
            "totalPages": total_pages,
            "hasNextPage": page < total_pages,
            "hasNext": page < total_pages,
            "hasPreviousPage": page > 1,
            "hasPrev": page > 1
        },
        "data": [format_shipment_response(s, db) for s in shipments]
    }

@router.post("/from-enquiry/{enquiryId}")
def create_shipment_from_enquiry(enquiryId: int, db: Session = Depends(get_db)):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiryId).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    existing = db.query(Shipment).filter(Shipment.enquiryId == enquiry.id).first()
    if existing:
        return {"message": "Shipment already exists for this enquiry", "shipment": format_shipment_response(existing, db)}

    shipment = Shipment(
        enquiryId=enquiry.id,
        customerId=enquiry.customerId or 1,
        countryId=enquiry.destinationCountry,
        status="SHIPMENT_CREATED"
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    # Associate enquiry boxes to shipment
    if enquiry.boxes:
        for b in enquiry.boxes:
            b.shipmentId = shipment.id
        db.commit()

    # Copy pickup locations if any
    if enquiry.pickupLocations:
        for pl in enquiry.pickupLocations:
            db.add(ShipmentPickUpLocation(shipmentId=shipment.id, location=pl.location))
        db.commit()

    enquiry.status = "SHIPMENT_CREATED"
    db.commit()

    return {"message": "Shipment created successfully", "shipment": format_shipment_response(shipment, db)}

@router.post("/from-enquiries")
def create_multiple_shipments_from_enquiries(payload: BulkShipmentsFromEnquiriesRequest, db: Session = Depends(get_db)):
    raw_ids = payload.enquiryIds or payload.ids or []
    created = []
    
    for raw_id in raw_ids:
        try:
            eid = int(raw_id)
        except (ValueError, TypeError):
            continue

        enquiry = db.query(Enquiry).filter(Enquiry.id == eid).first()
        if not enquiry:
            continue

        s = db.query(Shipment).filter(Shipment.enquiryId == enquiry.id).first()
        if not s:
            # Check if destination country has an agent
            agent_code = None
            country_name = enquiry.country.name if enquiry.country else (enquiry.destinationLocation or enquiry.receiverCountry or "")
            if country_name:
                agent_match = db.query(Agent).filter(
                    (Agent.country.ilike(f"%{country_name}%")) | 
                    (Agent.name.ilike(f"%{country_name}%"))
                ).first()
                if agent_match:
                    agent_code = agent_match.code

            s = Shipment(
                enquiryId=enquiry.id,
                customerId=enquiry.customerId or 1,
                countryId=enquiry.destinationCountry,
                status="SHIPMENT_CREATED",
                agent=agent_code
            )

            if agent_code:
                hawb_res = compute_next_hawb_for_agent(db, agent_code)
                s.hawbno = hawb_res["hawbno"]
                s.agentShipmentNumber = hawb_res["nextSequence"]

            db.add(s)
            db.commit()
            db.refresh(s)

        # Associate all enquiry boxes with shipment
        if enquiry.boxes:
            for b in enquiry.boxes:
                b.shipmentId = s.id
            db.commit()

        enquiry.status = "SHIPMENT_CREATED"
        created.append(s)

    db.commit()
    return {"message": f"{len(created)} shipments created successfully"}

@router.get("/getagentshipmentHAWBNO")
def get_agent_shipment_hawbno(
    agentId: Optional[str] = Query(None),
    agentCode: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    code = agentCode
    if not code and agentId:
        try:
            aid = int(agentId)
            agent = db.query(Agent).filter(Agent.id == aid).first()
            if agent:
                code = agent.code
        except (ValueError, TypeError):
            pass
    if not code:
        code = "NET"

    res = compute_next_hawb_for_agent(db, code)
    return res

@router.get("/location-history")
def get_location_history(shipmentId: Optional[int] = None, db: Session = Depends(get_db)):
    if shipmentId:
        return db.query(TransitPoint).filter(TransitPoint.shipmentId == shipmentId).order_by(TransitPoint.timestamp.desc()).all()
    return db.query(TransitPoint).order_by(TransitPoint.timestamp.desc()).limit(100).all()

@router.get("/{id}")
@router.get("/getById/{id}")
def get_shipment_by_id(id: int, db: Session = Depends(get_db)):
    s = db.query(Shipment).filter(Shipment.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return format_shipment_response(s, db)

@router.put("/{id}")
def update_shipment(id: int, payload: ShipmentUpdateRequest, db: Session = Depends(get_db)):
    s = db.query(Shipment).filter(Shipment.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")

    if payload.status is not None:
        s.status = payload.status
        if s.enquiry:
            s.enquiry.status = payload.status

    if payload.forwardingCompanyId is not None:
        try:
            s.forwardingCompanyId = int(payload.forwardingCompanyId) if payload.forwardingCompanyId else None
        except (ValueError, TypeError):
            pass

    if payload.serviceId is not None:
        try:
            s.serviceId = int(payload.serviceId) if payload.serviceId else None
        except (ValueError, TypeError):
            pass

    if payload.mawbId is not None:
        try:
            mid = int(payload.mawbId) if payload.mawbId else None
            s.mawbId = mid
            if s.enquiry:
                s.enquiry.mawbId = mid
        except (ValueError, TypeError):
            pass

    if payload.forwardingNumber is not None:
        s.forwardingNumber = payload.forwardingNumber

    if payload.note is not None:
        clean_note = payload.note.strip()
        s.note = clean_note
        if clean_note:
            # Memorize/store as milestone checkpoint if not duplicate
            last_te = db.query(TrackingEvent).filter(
                TrackingEvent.shipmentId == s.id,
                TrackingEvent.source == "MANUAL_NOTE"
            ).order_by(TrackingEvent.id.desc()).first()

            if not last_te or last_te.activity != clean_note:
                dest_country = s.country.name if s.country else (s.enquiry.receiverCountry if s.enquiry else "Destination Hub")
                loc = "Kathmandu, Nepal" if s.status in ("ENQUIRY_GENERATED", "PICKED_UP", "SHIPMENT_CREATED") else f"{dest_country} Hub / Transit"
                tr_no = s.hawbno or (s.enquiry.trackingNumber if s.enquiry else None) or s.forwardingNumber or f"NET-{s.id}"
                te = TrackingEvent(
                    shipmentId=s.id,
                    trackingNumber=tr_no,
                    status=s.status,
                    activity=clean_note,
                    location=loc,
                    checkpointTime=datetime.utcnow(),
                    source="MANUAL_NOTE"
                )
                db.add(te)

    # Agent update & HAWB generation
    if payload.agentId is not None:
        try:
            aid = int(payload.agentId)
            agent_obj = db.query(Agent).filter(Agent.id == aid).first()
            if agent_obj:
                s.agent = agent_obj.code
        except (ValueError, TypeError):
            pass
    elif payload.agent is not None:
        s.agent = payload.agent

    # HAWB assignment
    hawb = payload.hawbNumber or payload.hawbno
    if hawb:
        s.hawbno = hawb
    elif s.agent and not s.hawbno:
        hawb_res = compute_next_hawb_for_agent(db, s.agent)
        s.hawbno = hawb_res["hawbno"]
        s.agentShipmentNumber = hawb_res["nextSequence"]

    if payload.reciverName and s.enquiry:
        s.enquiry.receiverName = payload.reciverName

    if payload.trackingMode is not None:
        mode_val = payload.trackingMode.strip().upper()
        if mode_val in ("MANUAL", "API"):
            s.trackingMode = mode_val
            if s.enquiry:
                s.enquiry.trackingMode = mode_val

    db.commit()
    db.refresh(s)
    return {"message": "Shipment updated successfully", "shipment": format_shipment_response(s, db)}

@router.patch("/{id}/status")
def update_shipment_status(id: int, payload: ShipmentStatusUpdateRequest, db: Session = Depends(get_db)):
    s = db.query(Shipment).filter(Shipment.id == id).first()
    if not s:
        # Fallback: check if id is an enquiryId
        e = db.query(Enquiry).filter(Enquiry.id == id).first()
        if e:
            if e.shipments:
                s = e.shipments[0]
            else:
                e.status = payload.status
                if payload.note and payload.note.strip():
                    e.note = payload.note.strip()
                db.commit()
                return {"message": "Enquiry status updated successfully", "status": e.status, "note": getattr(e, "note", None)}
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    s.status = payload.status
    if s.enquiry:
        s.enquiry.status = payload.status

    if payload.note and payload.note.strip():
        clean_note = payload.note.strip()
        s.note = clean_note
        dest_country = s.country.name if s.country else (s.enquiry.receiverCountry if s.enquiry else "Destination Hub")
        loc = payload.location or ("Kathmandu, Nepal" if payload.status in ("ENQUIRY_GENERATED", "PICKED_UP", "SHIPMENT_CREATED") else f"{dest_country} Hub / Transit")
        tr_no = s.hawbno or (s.enquiry.trackingNumber if s.enquiry else None) or s.forwardingNumber or f"NET-{s.id}"
        te = TrackingEvent(
            shipmentId=s.id,
            trackingNumber=tr_no,
            status=payload.status,
            activity=clean_note,
            location=loc,
            checkpointTime=datetime.utcnow(),
            source="MANUAL_NOTE"
        )
        db.add(te)

    db.commit()
    return {"message": "Status updated successfully", "status": s.status, "note": getattr(s, "note", None)}

@router.post("/bulk-status-change")
def bulk_update_status(payload: BulkStatusChangeRequest, db: Session = Depends(get_db)):
    raw_ids = payload.shipmentIds or payload.id or []
    updated_count = 0
    for raw_id in raw_ids:
        try:
            sid = int(raw_id)
        except (ValueError, TypeError):
            continue
        s = db.query(Shipment).filter(Shipment.id == sid).first()
        if s:
            s.status = payload.status
            if s.enquiry:
                s.enquiry.status = payload.status
            updated_count += 1
    db.commit()
    return {"message": f"{updated_count} shipments status updated successfully"}

@router.post("/batch-add-note")
def batch_add_note(payload: BatchAddNoteRequest, db: Session = Depends(get_db)):
    raw_ids = payload.shipmentIds or payload.id or []
    updated_count = 0
    for raw_id in raw_ids:
        try:
            sid = int(raw_id)
        except (ValueError, TypeError):
            continue
        s = db.query(Shipment).filter(Shipment.id == sid).first()
        if s:
            s.note = payload.note
            updated_count += 1
    db.commit()
    return {"message": f"Note added to {updated_count} shipments successfully"}

@router.get("/summary/{id}")
def get_shipment_summary(id: int, db: Session = Depends(get_db)):
    s = db.query(Shipment).filter(Shipment.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return format_shipment_response(s, db)

@router.get("/customer/{customerId}")
def get_shipments_by_customer(customerId: int, db: Session = Depends(get_db)):
    shipments = db.query(Shipment).filter(Shipment.customerId == customerId).all()
    return [format_shipment_response(s, db) for s in shipments]


@router.post("/{id}/assign-agent")
def assign_agent_to_shipment(id: int, payload: AssignAgentRequest, db: Session = Depends(get_db)):
    s = db.query(Shipment).filter(Shipment.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")

    code = payload.agentCode
    if not code and payload.agentId:
        agent = db.query(Agent).filter(Agent.id == payload.agentId).first()
        if agent:
            code = agent.code

    if not code:
        code = "NET"

    hawb_res = compute_next_hawb_for_agent(db, code)
    s.agent = code
    s.agentShipmentNumber = hawb_res["nextSequence"]
    s.hawbno = payload.hawbno or hawb_res["hawbno"]

    db.commit()
    db.refresh(s)

    return {
        "message": "Agent assigned and HAWB generated successfully",
        "shipmentId": s.id,
        "hawbno": s.hawbno,
        "agentCode": code
    }


@router.delete("/{shipmentId}")
def delete_shipment(shipmentId: int, db: Session = Depends(get_db)):
    s = db.query(Shipment).filter(Shipment.id == shipmentId).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    db.delete(s)
    db.commit()
    return {"message": "Shipment deleted successfully"}


class TrackingModeUpdateRequest(BaseModel):
    trackingMode: str  # 'MANUAL' or 'API'


@router.patch("/{id}/tracking-mode")
def update_shipment_tracking_mode(id: int, payload: TrackingModeUpdateRequest, db: Session = Depends(get_db)):
    mode = payload.trackingMode.strip().upper()
    if mode not in ("MANUAL", "API"):
        raise HTTPException(status_code=400, detail="trackingMode must be 'MANUAL' or 'API'")

    s = db.query(Shipment).filter(Shipment.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")

    s.trackingMode = mode
    if s.enquiry:
        s.enquiry.trackingMode = mode

    db.commit()
    db.refresh(s)
    return {
        "message": f"Tracking mode updated to {mode}",
        "shipmentId": s.id,
        "trackingMode": s.trackingMode
    }
