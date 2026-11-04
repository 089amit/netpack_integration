import math
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models.customer import Customer
from models.location import Country
from models.enquiry import Enquiry
from models.shipment import Shipment
from schemas.customer import CustomerCreateRequest, CustomerUpdateRequest
from services.auth_service import get_requester_identity

router = APIRouter(prefix="/api/customer", tags=["Customer"])

@router.get("")
@router.get("/")
def get_all_customers(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    gender: Optional[str] = None,
    countryId: Optional[str] = None,
    isOrganization: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    requester = get_requester_identity(authorization, db)
    q = db.query(Customer)

    # Scoping: If caller is a Customer or User (Cargo Courier), only return their own Customer record
    if requester.is_authenticated and requester.is_user_or_customer:
        user_id = requester.user.id if requester.user else None
        user_email = requester.user.email if requester.user else None
        filter_cond = []
        if user_id:
            filter_cond.append(Customer.userId == user_id)
        if user_email:
            filter_cond.append(Customer.email.ilike(user_email.strip()))
        if requester.customer:
            filter_cond.append(Customer.id == requester.customer.id)
        if filter_cond:
            from sqlalchemy import or_
            q = q.filter(or_(*filter_cond))
        else:
            q = q.filter(Customer.id == -1)
    if search:
        s = f"%{search}%"
        q = q.filter((Customer.name.ilike(s)) | (Customer.email.ilike(s)) | (Customer.phone.ilike(s)))
    if gender:
        genders = [g.strip() for g in gender.split(",") if g.strip()]
        if genders:
            q = q.filter(Customer.gender.in_(genders))
    if countryId:
        cids = []
        for cid in countryId.split(","):
            try:
                cids.append(int(cid.strip()))
            except ValueError:
                pass
        if cids:
            q = q.filter(Customer.countryId.in_(cids))
    if isOrganization is not None:
        if isOrganization.lower() == "true":
            q = q.filter(Customer.isOrganization == True)
        elif isOrganization.lower() == "false":
            q = q.filter(Customer.isOrganization == False)

    total = q.count()
    total_pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
    customers = q.order_by(Customer.createdAt.desc()).offset((page - 1) * limit).limit(limit).all() if limit > 0 else q.all()

    res = []
    for c in customers:
        res.append({
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "gender": c.gender,
            "isOrganization": c.isOrganization,
            "organizationName": c.organizationName,
            "address1": c.address1,
            "address2": c.address2,
            "city": c.city,
            "state": c.state,
            "countryId": c.countryId,
            "country": {"id": c.country.id, "name": c.country.name} if c.country else None,
            "postcode": c.postcode,
            "userId": c.userId,
            "isUser": bool(c.userId),
            "userRole": (c.linkedUser.role.name if c.linkedUser and c.linkedUser.role else ("RETAIL_COURIER" if c.userId else None)),
            "createdAt": c.createdAt.isoformat() if c.createdAt else None,
            "updatedAt": c.updatedAt.isoformat() if c.updatedAt else None
        })
    return {
        "data": res,
        "pagination": {
            "page": page,
            "limit": limit,
            "totalItems": total,
            "totalPages": total_pages,
            "hasNextPage": page < total_pages,
            "hasPreviousPage": page > 1
        }
    }

@router.post("")
@router.post("/")
def create_customer(payload: CustomerCreateRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower() if payload.email and payload.email.strip() else None
    if clean_email:
        existing = db.query(Customer).filter(func.lower(Customer.email) == clean_email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this email already exists")

    c = Customer(
        name=payload.name,
        phone=payload.phone,
        email=clean_email,
        gender=payload.gender,
        isOrganization=payload.isOrganization or False,
        organizationName=payload.organizationName,
        address1=payload.address1,
        address2=payload.address2,
        city=payload.city,
        state=payload.state,
        countryId=payload.countryId,
        postcode=payload.postcode
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.get("/getById/{id}")
def get_customer_by_id(id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "id": c.id,
        "name": c.name,
        "phone": c.phone,
        "email": c.email,
        "gender": c.gender,
        "isOrganization": c.isOrganization,
        "organizationName": c.organizationName,
        "address1": c.address1,
        "address2": c.address2,
        "city": c.city,
        "state": c.state,
        "countryId": c.countryId,
        "country": {"id": c.country.id, "name": c.country.name} if c.country else None,
        "postcode": c.postcode,
        "createdAt": c.createdAt,
        "updatedAt": c.updatedAt
    }

@router.put("/updateById/{id}")
def update_customer(id: int, payload: CustomerUpdateRequest, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")

    if payload.name is not None:
        c.name = payload.name
    if payload.phone is not None:
        c.phone = payload.phone
    if payload.email is not None:
        c.email = payload.email
    if payload.gender is not None:
        c.gender = payload.gender
    if payload.isOrganization is not None:
        c.isOrganization = payload.isOrganization
    if payload.organizationName is not None:
        c.organizationName = payload.organizationName
    if payload.address1 is not None:
        c.address1 = payload.address1
    if payload.address2 is not None:
        c.address2 = payload.address2
    if payload.city is not None:
        c.city = payload.city
    if payload.state is not None:
        c.state = payload.state
    if payload.countryId is not None:
        c.countryId = payload.countryId
    if payload.postcode is not None:
        c.postcode = payload.postcode

    db.commit()
    db.refresh(c)
    return {"message": "Customer updated successfully", "customer": c}

@router.delete("/{id}")
def delete_customer(id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(c)
    db.commit()
    return {"message": "Customer deleted successfully"}

@router.get("/history/{customerId}")
def get_customer_history(customerId: int, db: Session = Depends(get_db)):
    enquiries = db.query(Enquiry).filter(Enquiry.customerId == customerId).all()
    shipments = db.query(Shipment).filter(Shipment.customerId == customerId).all()
    return {
        "customerId": customerId,
        "enquiries": [
            {
                "id": e.id,
                "trackingNumber": e.trackingNumber,
                "status": e.status,
                "destination": e.country.name if e.country else e.destinationLocation,
                "weight": e.weight,
                "createdAt": e.createdAt
            } for e in enquiries
        ],
        "shipments": [
            {
                "id": s.id,
                "status": s.status,
                "hawbno": s.hawbno,
                "forwardingNumber": s.forwardingNumber,
                "createdAt": s.createdAt
            } for s in shipments
        ]
    }

@router.get("/getProfileCompletionStatus/{id}")
def get_profile_completion_status(id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")

    fields = [c.name, c.phone, c.email, c.address1, c.city, c.countryId]
    completed = sum(1 for f in fields if f)
    percentage = int((completed / len(fields)) * 100)

    return {
        "customerId": id,
        "isCompleted": percentage >= 100,
        "completionPercentage": percentage
    }
