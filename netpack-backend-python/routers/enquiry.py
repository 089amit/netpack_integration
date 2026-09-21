from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
from database import get_db
from models.enquiry import Enquiry, EnquiryItem, Box, BoxItem, PickupLocationEnquiry
from models.shipment import Shipment
from models.customer import Customer
from models.location import Country, AreaSurcharge
from models.user import User
from schemas.enquiry import (
    EnquiryCreateRequest, EnquiryStatusUpdateRequest, AddBoxItemRequest
)
from services.hawb_service import generate_tracking_number
from services.auth_service import get_current_user_any
from services.email_service import send_enquiry_booking_notification

router = APIRouter(prefix="/api/enquiry", tags=["Enquiry"])

def format_enquiry_response(e: Enquiry) -> Dict[str, Any]:
    # Look up linked shipment (if enquiry has been pushed to shipment)
    shipment = e.shipments[0] if e.shipments else None
    fwd_company_name = shipment.forwardingCompany.name if (shipment and shipment.forwardingCompany) else None
    fwd_service_name = shipment.service.name if (shipment and shipment.service) else None
    fwd_number = shipment.forwardingNumber if shipment else None
    hawb_no = shipment.hawbno if shipment else None
    agent = shipment.agent if shipment else None
    shipment_id = shipment.id if shipment else None
    shipment_status = shipment.status if shipment else None

    return {
        "id": e.id,
        "trackingNumber": e.trackingNumber,
        "customerId": e.customerId,
        "destinationLocation": e.destinationLocation,
        "pinCode": e.pinCode,
        "destinationCountry": e.destinationCountry,
        "noOfBox": e.noOfBox,
        "weight": e.weight,
        "status": shipment_status or e.status,
        "estimatedRate": e.estimatedRate,
        "finalRate": e.finalRate,
        "currency": e.currency,
        "createdAt": e.createdAt,
        "updatedAt": e.updatedAt,
        "senderName": e.senderName or (e.customer.name if e.customer else None),
        "senderAddressLine1": e.senderAddressLine1,
        "senderAddressLine2": e.senderAddressLine2,
        "senderPostcodeCity": e.senderPostcodeCity,
        "senderLocation": e.senderLocation,
        "senderCountry": e.senderCountry or "Nepal",
        "senderPhone": e.senderPhone or (e.customer.phone if e.customer else None),
        "senderEmail": e.senderEmail or (e.customer.email if e.customer else None),
        "senderCity": e.senderCity,
        "senderPostcode": e.senderPostcode,
        "receiverName": e.receiverName,
        "receiverAddressLine1": e.receiverAddressLine1,
        "receiverAddressLine2": e.receiverAddressLine2,
        "receiverPostcodeCity": e.receiverPostcodeCity,
        "receiverLocation": e.receiverLocation or e.receiverCity,
        "receiverCountry": e.receiverCountry or (e.country.name if e.country else None),
        "receivercompanyName": e.receivercompanyName,
        "receiverTelephone": e.receiverTelephone,
        "receiverEmail": e.receiverEmail,
        "receiverState": e.receiverState,
        "receiverCity": e.receiverCity,
        "receiverPostcode": e.receiverPostcode,
        "mawbId": e.mawbId,
        "createdBy": e.createdBy,
        "forwardingCompanyName": fwd_company_name,
        "forwardingServiceName": fwd_service_name,
        "forwardingNumber": fwd_number,
        "forwardingDetails": f"{fwd_company_name}: {fwd_number}" if (fwd_company_name and fwd_number) else (fwd_company_name or fwd_number or "-"),
        "hawbNumber": hawb_no,
        "hawbno": hawb_no,
        "agent": agent,
        "shipmentId": shipment_id,
        "shipmentStatus": shipment_status,
        "weightProofImageUrl": e.weightProofImageUrl,
        "pickedUpAt": e.pickedUpAt.isoformat() if e.pickedUpAt else None,
        "pickedUpBy": e.pickedUpBy,
        "pickupNotes": e.pickupNotes,
        "volumetricWeight": e.volumetricWeight,
        "chargeableWeight": e.chargeableWeight,
        "trackingMode": getattr(e, "trackingMode", "MANUAL") or "MANUAL",
        "isFromCustomer": bool(getattr(e, "isFromCustomer", False)),
        "isPacked": bool(getattr(e, "isPacked", False)),
        "packedAt": e.packedAt.isoformat() if getattr(e, "packedAt", None) else None,
        "pickupRequired": bool(getattr(e, "pickupRequired", True)),
        "pickupStaffName": e.pickupStaff.fullName if e.pickupStaff else (e.pickupStaff.email if e.pickupStaff else None),
        "country": {"id": e.country.id, "name": e.country.name} if e.country else None,
        "customer": {"id": e.customer.id, "name": e.customer.name, "phone": e.customer.phone, "email": e.customer.email} if e.customer else None,
        "items": [
            {
                "id": i.id,
                "description": i.description,
                "weight": i.weight,
                "value": i.value,
                "quantity": i.quantity,
                "unitPrice": i.unitPrice,
                "hsCode": i.hsCode,
                "totalValue": i.totalValue
            } for i in e.items
        ],
        "boxes": [
            {
                "id": b.id,
                "trackingNumber": b.trackingNumber,
                "weight": b.weight,
                "dimensions": b.dimensions,
                "length": b.length,
                "breadth": b.breadth,
                "height": b.height,
                "multiplier": b.multiplier,
                "quantity": b.quantity,
                "value": b.value,
                "items": [
                    {
                        "id": bi.id,
                        "enquiryItemId": bi.enquiryItemId,
                        "quantity": bi.quantity,
                        "enquiryItem": {
                            "description": bi.enquiryItem.description if bi.enquiryItem else None
                        }
                    } for bi in b.items
                ]
            } for b in e.boxes
        ],
        "pickupLocations": [
            {
                "id": pl.id,
                "location": pl.location,
                "phoneNumber": pl.phoneNumber,
                "note": pl.note
            } for pl in e.pickupLocations
        ]
    }

@router.get("")
@router.get("/")
def get_all_enquiries(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: Optional[str] = None,
    status: Optional[str] = None,
    destinationCountry: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Enquiry)

    if status:
        query = query.filter(Enquiry.status == status)
    if destinationCountry:
        query = query.filter(Enquiry.destinationCountry == destinationCountry)
    if search:
        s = f"%{search}%"
        query = query.outerjoin(Enquiry.shipments).filter(
            (Enquiry.trackingNumber.ilike(s)) |
            (Enquiry.senderName.ilike(s)) |
            (Enquiry.receiverName.ilike(s)) |
            (Enquiry.receiverTelephone.ilike(s)) |
            (Shipment.hawbno.ilike(s)) |
            (Shipment.forwardingNumber.ilike(s))
        ).distinct()

    total_records = query.count()
    total_pages = (total_records + limit - 1) // limit
    enquiries = query.order_by(Enquiry.createdAt.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "pagination": {
            "page": page,
            "limit": limit,
            "totalRecords": total_records,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrev": page > 1
        },
        "data": [format_enquiry_response(e) for e in enquiries]
    }

def _to_float(val: Any, default: float = 0.0) -> float:
    if val is None or val == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def _to_int(val: Any, default: int = 1) -> int:
    if val is None or val == "":
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default

@router.post("")
@router.post("/webenquirycreate")
def create_enquiry(
    payload: EnquiryCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    tracking_no = generate_tracking_number()

    # Extract sender fields (supporting nested sender dict)
    sender = payload.sender or {}
    sender_name = payload.senderName or sender.get("name") or "Shipper"
    sender_address1 = payload.senderAddressLine1 or sender.get("addressLine1") or ""
    sender_address2 = payload.senderAddressLine2 or sender.get("addressLine2") or ""
    sender_city = payload.senderCity or sender.get("city") or sender.get("location") or ""
    sender_country = payload.senderCountry or sender.get("country") or "Nepal"
    sender_phone = payload.senderPhone or sender.get("telephoneEmail") or payload.phoneNumber or ""
    sender_postcode = payload.senderPostcode or sender.get("postcode") or sender.get("postcodeCity") or ""
    sender_email = payload.senderEmail or ""

    # Extract receiver fields (supporting nested receiver dict)
    receiver = payload.receiver or {}
    receiver_name = payload.receiverName or receiver.get("name") or "Consignee"
    receiver_address1 = payload.receiverAddressLine1 or receiver.get("addressLine1") or ""
    receiver_address2 = payload.receiverAddressLine2 or receiver.get("addressLine2") or ""
    receiver_city = payload.receiverCity or receiver.get("city") or receiver.get("location") or ""
    receiver_country = payload.receiverCountry or receiver.get("country") or ""
    receiver_phone = payload.receiverTelephone or receiver.get("telephone") or ""
    receiver_email = payload.receiverEmail or receiver.get("email") or ""
    receiver_postcode = payload.receiverPostcode or receiver.get("postcode") or receiver.get("postcodeCity") or ""
    receiver_company = payload.receivercompanyName or receiver.get("companyName") or ""
    receiver_state = payload.receiverState or receiver.get("state") or ""

    # Destination country lookup
    dest_country_id = payload.destinationCountry or payload.receiverCountryId
    if not dest_country_id:
        if receiver_country:
            c = db.query(Country).filter(Country.name.ilike(receiver_country.strip())).first()
            if c:
                dest_country_id = c.id
        if not dest_country_id:
            c = db.query(Country).first()
            dest_country_id = c.id if c else 1

    # Customer lookup or auto-creation
    customer_id = _to_int(payload.customerId, default=0) or None
    clean_sender_email = sender_email.strip() if sender_email and sender_email.strip() else None
    if not customer_id and sender_phone:
        cust = db.query(Customer).filter(Customer.phone == sender_phone).first()
        if not cust:
            cust = Customer(
                name=sender_name,
                phone=sender_phone,
                email=clean_sender_email,
                address1=sender_address1,
                city=sender_city,
                countryId=dest_country_id
            )
            db.add(cust)
            db.commit()
            db.refresh(cust)
        customer_id = cust.id

    # Compute total weight & box count from items/boxes if not provided
    items_list = payload.items or []
    boxes_list = payload.boxes or []

    computed_weight = _to_float(payload.weight, default=0.0)
    if computed_weight <= 0.0 and items_list:
        computed_weight = sum([_to_float(i.weight) for i in items_list])
    if computed_weight <= 0.0 and boxes_list:
        computed_weight = sum([_to_float(b.weight) for b in boxes_list])
    if computed_weight <= 0.0:
        computed_weight = 1.0

    num_boxes = _to_int(payload.noOfBox, default=0)
    if num_boxes <= 0:
        num_boxes = len(boxes_list) if boxes_list else 1

    enq = Enquiry(
        trackingNumber=tracking_no,
        customerId=customer_id,
        destinationCountry=dest_country_id,
        destinationLocation=payload.destinationLocation or receiver_city or receiver_country,
        pinCode=_to_int(payload.pinCode, default=None),
        noOfBox=num_boxes,
        weight=computed_weight,
        status=payload.status or "ENQUIRY_GENERATED",
        estimatedRate=_to_float(payload.estimatedRate, default=None),
        finalRate=_to_float(payload.finalRate, default=None),
        currency=payload.currency or "NPR",
        senderName=sender_name,
        senderAddressLine1=sender_address1,
        senderAddressLine2=sender_address2,
        senderPostcodeCity=sender_postcode,
        senderLocation=sender_city,
        senderCountry=sender_country,
        senderPhone=sender_phone,
        senderEmail=sender_email,
        senderCity=sender_city,
        senderPostcode=sender_postcode,
        receiverName=receiver_name,
        receiverAddressLine1=receiver_address1,
        receiverAddressLine2=receiver_address2,
        receiverPostcodeCity=receiver_postcode,
        receiverLocation=receiver_city,
        receiverCountry=receiver_country,
        receivercompanyName=receiver_company,
        receiverTelephone=receiver_phone,
        receiverEmail=receiver_email,
        receiverState=receiver_state,
        receiverCity=receiver_city,
        receiverPostcode=receiver_postcode
    )
    db.add(enq)
    db.commit()
    db.refresh(enq)

    # Add Items
    created_items = []
    if items_list:
        for itm in items_list:
            unit_price = _to_float(itm.unitPrice)
            qty = _to_int(itm.quantity, default=1)
            total_val = _to_float(itm.totalValue) or (unit_price * qty) or _to_float(itm.value)
            ei = EnquiryItem(
                enquiryId=enq.id,
                description=itm.description or "General Goods",
                weight=_to_float(itm.weight),
                value=_to_float(itm.value) or total_val,
                quantity=qty,
                unitPrice=unit_price,
                hsCode=itm.hsCode,
                totalValue=total_val
            )
            db.add(ei)
            created_items.append(ei)
        db.commit()

    # Add Boxes
    if boxes_list:
        for idx, b in enumerate(boxes_list, 1):
            box = Box(
                enquiryId=enq.id,
                trackingNumber=b.trackingNumber or f"{tracking_no}-{idx}",
                weight=_to_float(b.weight) or (computed_weight / len(boxes_list)),
                dimensions=b.dimensions or "30x20x20",
                length=_to_float(b.length, 30.0),
                breadth=_to_float(b.breadth, 20.0),
                height=_to_float(b.height, 20.0),
                multiplier=_to_float(b.multiplier, 1.0),
                quantity=_to_int(b.quantity, 1),
                value=_to_float(b.value)
            )
            db.add(box)
    else:
        # Default create at least 1 box
        box = Box(
            enquiryId=enq.id,
            trackingNumber=f"{tracking_no}-1",
            weight=computed_weight,
            dimensions="30x20x20",
            length=30.0,
            breadth=20.0,
            height=20.0,
            multiplier=1.0,
            quantity=1,
            value=sum([ci.totalValue or 0 for ci in created_items]) or None
        )
        db.add(box)

    # Add Pickup Locations
    if payload.pickupLocations:
        for pl in payload.pickupLocations:
            pickup = PickupLocationEnquiry(
                enquiryId=enq.id,
                location=pl.location,
                phoneNumber=pl.phoneNumber,
                note=pl.note
            )
            db.add(pickup)

    db.commit()
    db.refresh(enq)

    # Dispatch confirmation to sender and copy to receiver (if receiverEmail is provided)
    try:
        send_enquiry_booking_notification(enq, background_tasks)
    except Exception as em_err:
        print(f"[Email Notification Warning] {em_err}")

    return {"message": "Enquiry created successfully", "enquiry": format_enquiry_response(enq)}

@router.get("/get/{id}")
def get_enquiry_by_id(id: int, db: Session = Depends(get_db)):
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return format_enquiry_response(e)

@router.get("/track/{trackingNumber}")
def track_by_tracking_number(trackingNumber: str, db: Session = Depends(get_db)):
    e = db.query(Enquiry).filter(Enquiry.trackingNumber == trackingNumber).first()
    if not e:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    return format_enquiry_response(e)

@router.get("/items/{id}")
def get_enquiry_items(id: int, db: Session = Depends(get_db)):
    items = db.query(EnquiryItem).filter(EnquiryItem.enquiryId == id).all()
    return items

@router.get("/customer/{id}")
def get_enquiries_by_customer_id(id: int, db: Session = Depends(get_db)):
    enquiries = db.query(Enquiry).filter(Enquiry.customerId == id).all()
    return [format_enquiry_response(e) for e in enquiries]

@router.put("/webenquiryupdate/{id}")
@router.put("/update/{id}")
def update_enquiry(id: int, payload: EnquiryCreateRequest, db: Session = Depends(get_db)):
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    if payload.senderName is not None: e.senderName = payload.senderName
    if payload.senderPhone is not None: e.senderPhone = payload.senderPhone
    if payload.senderEmail is not None: e.senderEmail = payload.senderEmail
    if payload.senderAddressLine1 is not None: e.senderAddressLine1 = payload.senderAddressLine1
    if payload.senderCity is not None: e.senderCity = payload.senderCity
    if payload.senderPostcode is not None: e.senderPostcode = payload.senderPostcode

    if payload.receiverName is not None: e.receiverName = payload.receiverName
    if payload.receiverTelephone is not None: e.receiverTelephone = payload.receiverTelephone
    if payload.receiverEmail is not None: e.receiverEmail = payload.receiverEmail
    if payload.receiverAddressLine1 is not None: e.receiverAddressLine1 = payload.receiverAddressLine1
    if payload.receiverCity is not None: e.receiverCity = payload.receiverCity
    if payload.receiverPostcode is not None: e.receiverPostcode = payload.receiverPostcode
    if payload.receiverCountry is not None: e.receiverCountry = payload.receiverCountry

    if payload.weight is not None: e.weight = payload.weight
    if payload.noOfBox is not None: e.noOfBox = payload.noOfBox
    if payload.estimatedRate is not None: e.estimatedRate = payload.estimatedRate
    if payload.finalRate is not None: e.finalRate = payload.finalRate
    if payload.status is not None:
        e.status = payload.status
        for s in e.shipments:
            s.status = payload.status

    if payload.pickupLocations is not None:
        db.query(PickupLocationEnquiry).filter(PickupLocationEnquiry.enquiryId == e.id).delete()
        for pl in payload.pickupLocations:
            if pl.location:
                db.add(PickupLocationEnquiry(
                    enquiryId=e.id,
                    location=pl.location,
                    phoneNumber=pl.phoneNumber,
                    note=pl.note
                ))

    db.commit()
    db.refresh(e)
    return {"message": "Enquiry updated successfully", "enquiry": format_enquiry_response(e)}

@router.post("/update-pickup-locations/{id}")
@router.put("/update-pickup-locations/{id}")
def update_pickup_locations(id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    pls = payload.get("pickupLocations", [])
    db.query(PickupLocationEnquiry).filter(PickupLocationEnquiry.enquiryId == e.id).delete()
    for pl in pls:
        loc_str = pl.get("location")
        if loc_str:
            db.add(PickupLocationEnquiry(
                enquiryId=e.id,
                location=loc_str,
                phoneNumber=pl.get("phoneNumber"),
                note=pl.get("note")
            ))
    db.commit()
    return {"message": "Pickup locations updated successfully"}

@router.patch("/update-status/{id}")
def update_enquiry_status(id: int, payload: EnquiryStatusUpdateRequest, db: Session = Depends(get_db)):
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    e.status = payload.status
    for s in e.shipments:
        s.status = payload.status
    db.commit()
    return {"message": "Enquiry status updated successfully", "status": e.status}

@router.delete("/delete/{id}")
def delete_enquiry(id: int, db: Session = Depends(get_db)):
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    db.delete(e)
    db.commit()
    return {"message": "Enquiry deleted successfully"}

@router.post("/item/addBoxItem")
def add_box_item(payload: AddBoxItemRequest, db: Session = Depends(get_db)):
    existing = db.query(BoxItem).filter(
        BoxItem.boxId == payload.boxId,
        BoxItem.enquiryItemId == payload.enquiryItemId
    ).first()
    if existing:
        existing.quantity = payload.quantity
    else:
        bi = BoxItem(boxId=payload.boxId, enquiryItemId=payload.enquiryItemId, quantity=payload.quantity)
        db.add(bi)
    db.commit()
    return {"message": "Box item linked successfully"}

@router.post("/surchargecheck")
def check_area_surcharge(payload: Dict[str, Any], db: Session = Depends(get_db)):
    country_code = payload.get("countryCode")
    postal_code = payload.get("postalCode")
    location_name = payload.get("locationName")

    query = db.query(AreaSurcharge)
    if country_code:
        query = query.filter(AreaSurcharge.countryCode == country_code)
    
    surcharge = None
    if postal_code:
        surcharge = query.filter(
            AreaSurcharge.postalCodeFrom <= postal_code,
            AreaSurcharge.postalCodeTo >= postal_code
        ).first()
    if not surcharge and location_name:
        surcharge = query.filter(AreaSurcharge.locationName.ilike(f"%{location_name}%")).first()

    if surcharge:
        return {
            "hasSurcharge": True,
            "surchargeType": surcharge.surchargeType,
            "countryCode": surcharge.countryCode
        }
    return {"hasSurcharge": False}

@router.get("/check-edit-permission/{id}")
def check_edit_permission(id: int, db: Session = Depends(get_db)):
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    # Editable if not yet delivered
    is_editable = e.status not in ["DELIVERED"]
    return {"canEdit": is_editable, "status": e.status}

@router.get("/{id}")
def get_enquiry_by_id_direct(id: int, db: Session = Depends(get_db)):
    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return format_enquiry_response(e)


@router.patch("/{id}/tracking-mode")
def update_enquiry_tracking_mode(id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    mode = (payload.get("trackingMode") or "").strip().upper()
    if mode not in ("MANUAL", "API"):
        raise HTTPException(status_code=400, detail="trackingMode must be 'MANUAL' or 'API'")

    e = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    e.trackingMode = mode
    if e.shipments:
        for s in e.shipments:
            s.trackingMode = mode

    db.commit()
    db.refresh(e)
    return {
        "message": f"Tracking mode updated to {mode}",
        "enquiryId": e.id,
        "trackingMode": e.trackingMode
    }

