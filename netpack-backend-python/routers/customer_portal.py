import os
import uuid
import random
import string
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Header, status, UploadFile, File, BackgroundTasks
from sqlalchemy import or_
from sqlalchemy.orm import Session

import config
from database import get_db
from models.user import User
from models.customer import Customer, Notification
from models.enquiry import Enquiry, EnquiryItem, Box, PickupLocationEnquiry
from models.shipment import Shipment
from models.location import Country
from services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token,
)
from services.hawb_service import generate_tracking_number
from services.email_service import send_enquiry_booking_notification, send_user_welcome_email, send_email

router = APIRouter(prefix="/api/customer", tags=["Customer Portal"])

AVATARS_DIR = config.UPLOADS_DIR / "avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)

# In-memory store for PWA login verification codes: email -> (code, expiry)
_pwa_email_codes: Dict[str, Tuple[str, datetime]] = {}


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class CustomerLoginRequest(BaseModel):
    email: str
    password: str


class CustomerSendCodeRequest(BaseModel):
    email: str


class CustomerVerifyCodeRequest(BaseModel):
    email: str
    code: str


class CustomerSignupRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    countryId: Optional[int] = None
    country: Optional[str] = None
    photoUrl: Optional[str] = None


class CustomerGoogleAuthRequest(BaseModel):
    email: str
    name: str
    googleId: Optional[str] = None
    photoUrl: Optional[str] = None
    phone: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    countryId: Optional[int] = None
    country: Optional[str] = None


class CustomerProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    countryId: Optional[int] = None
    country: Optional[str] = None
    photoUrl: Optional[str] = None


# ─── Country Resolution Helper ────────────────────────────────────────────────

def resolve_country(db: Session, country_id: Optional[int] = None, country_name: Optional[str] = None) -> int:
    """
    Guarantees a valid, existing countryId in the database.
    First tries to find by country_name (case-insensitive).
    Next checks if country_id exists.
    Falls back to 'Nepal' or the first available country in the database.
    """
    if country_name and country_name.strip():
        c = db.query(Country).filter(Country.name.ilike(country_name.strip())).first()
        if c:
            return c.id
    if country_id:
        c = db.query(Country).filter(Country.id == country_id).first()
        if c:
            return c.id
    nepal = db.query(Country).filter(Country.name.ilike("Nepal")).first()
    if nepal:
        return nepal.id
    first_c = db.query(Country).first()
    return first_c.id if first_c else 1


# ─── Booking Request Schema ──────────────────────────────────────────────────
# Rules: Customers CANNOT specify packing boxes or dimensions.
# NetPack Logistics handles packing at the warehouse.
# Customers only supply Commodity description and Approximate Weight!

class CustomerEnquiryCreateRequest(BaseModel):
    commodity: str = Field(..., description="Description of goods, e.g. Handicrafts, Documents, Tea, Garments")
    approximateWeight: float = Field(..., gt=0, description="Approximate weight in kg")
    
    # Shipper details
    senderName: Optional[str] = None
    senderPhone: Optional[str] = None
    senderEmail: Optional[str] = None
    senderAddress: Optional[str] = None
    senderCity: Optional[str] = "Kathmandu"
    
    # Consignee details
    receiverName: str
    receiverPhone: str
    receiverEmail: Optional[str] = None
    receiverAddress: str
    receiverCity: str
    receiverCountry: str
    receiverCountryId: Optional[int] = None
    receiverPostcode: Optional[str] = None
    
    # Optional Pickup Request
    isPickupRequired: bool = True
    pickupAddress: Optional[str] = None
    pickupPhone: Optional[str] = None
    pickupNote: Optional[str] = None
    pickupPreferredTime: Optional[str] = None


# ─── Auth Dependencies ───────────────────────────────────────────────────────

def get_current_customer(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Customer:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: No authentication token provided"
        )
    token = authorization.split(" ")[1]
    decoded = decode_token(token, is_admin=False)
    if not decoded:
        # Fallback for admin/generic token
        decoded = decode_token(token, is_admin=True)
    if not decoded:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again."
        )

    customer_id = decoded.get("customerId") or decoded.get("id")
    customer = None
    if customer_id:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer and decoded.get("email"):
        customer = db.query(Customer).filter(Customer.email == decoded.get("email")).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer account not found"
        )
    return customer


def customer_to_dict(customer: Customer) -> Dict[str, Any]:
    c_name = "Nepal"
    c_id = customer.countryId or 1
    try:
        if customer.country:
            c_name = customer.country.name
            c_id = customer.country.id
    except Exception:
        pass

    is_incomplete = (
        not customer.phone
        or customer.phone == "+977-9800000000"
        or not customer.address1
    )
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "address1": customer.address1,
        "address2": getattr(customer, "address2", None),
        "city": customer.city or "Kathmandu",
        "state": customer.state,
        "postcode": getattr(customer, "postcode", None),
        "countryId": c_id,
        "country": c_name,              # Clean string name (e.g. "Nepal" or "Germany")
        "countryName": c_name,          # Clean string name
        "countryObj": {"id": c_id, "name": c_name},  # Backward compatibility object
        "photoUrl": getattr(customer, "photoUrl", None),
        "role": "CUSTOMER",
        "isIncomplete": is_incomplete
    }


# ─── Authentication Endpoints ────────────────────────────────────────────────

def build_pwa_verification_code_html(email: str, code: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
<div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
  <div style="background: #0D1B2A; padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px;">NETPACK</h1>
    <p style="color: #60A5FA; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Express Global Logistics</p>
  </div>
  <div style="padding: 28px 24px; text-align: center;">
    <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Customer Portal Verification Code</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Use the 6-digit confirmation code below to sign in or verify your NetPack Customer App account:
    </p>
    <div style="background: #f1f5f9; border: 2px dashed #0284c7; border-radius: 10px; padding: 18px; margin: 0 auto 24px auto; max-width: 280px;">
      <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7; font-family: monospace;">{code}</p>
    </div>
    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
      This verification code is valid for <strong>15 minutes</strong>. If you did not request this login code, you can safely ignore this email.
    </p>
  </div>
  <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
    <p style="margin: 0;">&copy; NetPack Logistics &bull; Kathmandu, Nepal &bull; info@netpacklogistic.com</p>
  </div>
</div>
</body>
</html>"""


@router.post("/auth/send-code")
def customer_send_login_code(
    payload: CustomerSendCodeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    code = f"{random.randint(100000, 999999)}"
    _pwa_email_codes[clean_email] = (code, datetime.utcnow() + timedelta(minutes=15))

    subject = f"[NetPack Logistics] Your Sign-in Verification Code: {code}"
    html = build_pwa_verification_code_html(clean_email, code)
    send_email(
        to_emails=clean_email,
        subject=subject,
        html_content=html,
        background_tasks=background_tasks
    )

    return {
        "message": f"Verification code sent to {clean_email}",
        "email": clean_email,
        "success": True
    }


@router.post("/auth/verify-code")
def customer_verify_login_code(
    payload: CustomerVerifyCodeRequest,
    db: Session = Depends(get_db)
):
    clean_email = payload.email.strip().lower()
    clean_code = payload.code.strip()

    stored = _pwa_email_codes.get(clean_email)
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code found for this email. Please request a new code."
        )

    stored_code, expiry = stored
    if datetime.utcnow() > expiry:
        _pwa_email_codes.pop(clean_email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    if stored_code != clean_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect verification code. Please check your email."
        )

    _pwa_email_codes.pop(clean_email, None)

    # Check if customer exists
    customer = db.query(Customer).filter(Customer.email.ilike(clean_email)).first()
    is_new_account = customer is None
    
    # Check if user exists (Cargo Couriers)
    user = db.query(User).filter(User.email.ilike(clean_email)).first()

    if not customer:
        nepal_id = resolve_country(db, getattr(user, "countryId", None) if user else None, "Nepal")
        if user:
            # Auto-create linked customer profile for this User
            customer = Customer(
                name=user.fullName or clean_email.split("@")[0],
                email=user.email,
                phone=user.phoneNumber or "+977-9800000000",
                password=user.password,
                userId=user.id,
                countryId=nepal_id,
                city=user.city or "Kathmandu",
                address1=user.address1,
                address2=user.address2,
                state=user.state,
                postcode=user.postcode,
                isOrganization=user.isOrganization,
                organizationName=user.organizationName
            )
        else:
            # Auto-create new customer
            random_pw = "".join(random.choices(string.ascii_letters + string.digits, k=16))
            customer = Customer(
                name=clean_email.split("@")[0].capitalize(),
                email=clean_email,
                phone="+977-9800000000",
                password=get_password_hash(random_pw),
                countryId=nepal_id,
                city="Kathmandu"
            )
        db.add(customer)
        db.commit()
        db.refresh(customer)
    elif user and not customer.userId:
        customer.userId = user.id
        db.commit()
        db.refresh(customer)

    token_payload = {
        "customerId": customer.id,
        "id": customer.id,
        "userId": customer.userId,
        "email": customer.email,
        "name": customer.name,
        "role": "CUSTOMER"
    }
    token = create_access_token(token_payload, is_admin=False, expires_delta=timedelta(days=30))

    resp_customer = customer_to_dict(customer)
    if is_new_account:
        resp_customer["isNewAccount"] = True

    return {
        "message": "Login successful",
        "token": token,
        "customer": resp_customer
    }


@router.post("/auth/login")
@router.post("/login")
@router.post("/customer-login")
def customer_login(payload: CustomerLoginRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    customer = db.query(Customer).filter(Customer.email.ilike(clean_email)).first()

    # 1. Try customer password verification if customer exists and has password
    if customer and customer.password and verify_password(payload.password, customer.password):
        token_payload = {
            "customerId": customer.id,
            "id": customer.id,
            "userId": customer.userId,
            "email": customer.email,
            "name": customer.name,
            "role": "CUSTOMER"
        }
        token = create_access_token(token_payload, is_admin=False, expires_delta=timedelta(days=30))
        return {
            "message": "Login successful",
            "token": token,
            "customer": customer_to_dict(customer)
        }

    # 2. Try User table (Cargo Couriers with USER role)
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if user and user.password and verify_password(payload.password, user.password):
        if not customer:
            customer = db.query(Customer).filter(or_(Customer.userId == user.id, Customer.email.ilike(clean_email))).first()

        if not customer:
            customer = Customer(
                name=user.fullName or clean_email.split("@")[0],
                email=user.email,
                phone=user.phoneNumber or "+977-9800000000",
                password=user.password,
                userId=user.id,
                countryId=resolve_country(db, user.countryId, "Nepal"),
                city=user.city or "Kathmandu",
                address1=user.address1,
                address2=user.address2,
                state=user.state,
                postcode=user.postcode,
                isOrganization=user.isOrganization,
                organizationName=user.organizationName
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)
        else:
            if not customer.userId or customer.password != user.password:
                customer.userId = user.id
                customer.password = user.password
                db.commit()
                db.refresh(customer)

        token_payload = {
            "customerId": customer.id,
            "id": customer.id,
            "userId": user.id,
            "email": customer.email,
            "name": customer.name,
            "role": "CUSTOMER"
        }
        token = create_access_token(token_payload, is_admin=False, expires_delta=timedelta(days=30))
        return {
            "message": "Login successful",
            "token": token,
            "customer": customer_to_dict(customer)
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password"
    )


@router.post("/auth/signup")
def customer_signup(
    payload: CustomerSignupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    clean_email = payload.email.strip().lower()
    existing = db.query(Customer).filter(Customer.email.ilike(clean_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    country_id = resolve_country(db, payload.countryId, payload.country)

    hashed_pw = get_password_hash(payload.password)
    customer = Customer(
        name=payload.name.strip(),
        email=clean_email,
        phone=payload.phone.strip(),
        password=hashed_pw,
        address1=payload.address1,
        address2=payload.address2,
        city=payload.city or "Kathmandu",
        postcode=payload.postcode,
        countryId=country_id,
        photoUrl=payload.photoUrl
    )
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

    # Welcome notification in portal
    welcome_notif = Notification(
        title="Welcome to NetPack Logistics!",
        body=f"Namaste {customer.name}, welcome aboard. You can now book express shipments, request doorstep pickups, and track your global cargo in real-time.",
        customerId=customer.id,
        scope="SPECIFIC_CUSTOMER",
        isRead=False
    )
    db.add(welcome_notif)
    db.commit()

    # Dispatch welcome email to customer
    send_user_welcome_email(
        to_email=customer.email,
        full_name=customer.name,
        role_name="CUSTOMER",
        password=payload.password,
        background_tasks=background_tasks
    )


    token_payload = {
        "customerId": customer.id,
        "id": customer.id,
        "email": customer.email,
        "name": customer.name,
        "role": "CUSTOMER"
    }
    token = create_access_token(token_payload, is_admin=False, expires_delta=timedelta(days=30))

    return {
        "message": "Registration successful",
        "token": token,
        "customer": customer_to_dict(customer)
    }


@router.post("/auth/google")
def customer_google_auth(payload: CustomerGoogleAuthRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    conditions = [Customer.email.ilike(clean_email)]
    if payload.googleId:
        conditions.append(Customer.firebaseUid == payload.googleId)
    customer = db.query(Customer).filter(or_(*conditions)).first()

    if customer:
        updated = False
        if payload.googleId and not customer.firebaseUid:
            customer.firebaseUid = payload.googleId
            updated = True
        if payload.photoUrl and (not customer.photoUrl or customer.photoUrl != payload.photoUrl):
            customer.photoUrl = payload.photoUrl
            updated = True
        if payload.phone and payload.phone != "+977-9800000000" and not customer.phone:
            customer.phone = payload.phone
            updated = True
        elif payload.phone and customer.phone == "+977-9800000000":
            customer.phone = payload.phone
            updated = True
        if payload.address1 and not customer.address1:
            customer.address1 = payload.address1
            updated = True
        if payload.address2 and not customer.address2:
            customer.address2 = payload.address2
            updated = True
        if payload.city and (not customer.city or customer.city == "Kathmandu"):
            customer.city = payload.city
            updated = True
        if payload.state and not customer.state:
            customer.state = payload.state
            updated = True
        if payload.postcode and not customer.postcode:
            customer.postcode = payload.postcode
            updated = True
        if payload.country or payload.countryId:
            valid_cid = resolve_country(db, payload.countryId, payload.country)
            if valid_cid != customer.countryId:
                customer.countryId = valid_cid
                updated = True
        if updated:
            db.commit()
            db.refresh(customer)
    else:
        # Auto-create customer profile from Google details
        country_id = resolve_country(db, payload.countryId, payload.country)

        # Generate a secure fallback password
        random_pw = "".join(random.choices(string.ascii_letters + string.digits, k=16))
        hashed_pw = get_password_hash(random_pw)

        customer = Customer(
            name=payload.name or clean_email.split("@")[0],
            email=clean_email,
            phone=payload.phone or "+977-9800000000",
            password=hashed_pw,
            firebaseUid=payload.googleId,
            countryId=country_id,
            address1=payload.address1,
            address2=payload.address2,
            city=payload.city or "Kathmandu",
            state=payload.state,
            postcode=payload.postcode,
            photoUrl=payload.photoUrl
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

        welcome_notif = Notification(
            title="Welcome to NetPack Logistics!",
            body=f"Welcome {customer.name}! You have signed in with Google. Book your first consignment and request doorstep pickup anytime.",
            customerId=customer.id,
            scope="SPECIFIC_CUSTOMER",
            isRead=False
        )
        db.add(welcome_notif)
        db.commit()

    token_payload = {
        "customerId": customer.id,
        "id": customer.id,
        "email": customer.email,
        "name": customer.name,
        "role": "CUSTOMER"
    }
    token = create_access_token(token_payload, is_admin=False, expires_delta=timedelta(days=30))

    return {
        "message": "Google authentication successful",
        "token": token,
        "customer": customer_to_dict(customer)
    }


# ─── Profile Endpoints ───────────────────────────────────────────────────────

@router.get("/profile")
@router.get("/auth/me")
def get_current_customer_profile(
    current_customer: Customer = Depends(get_current_customer)
):
    return customer_to_dict(current_customer)


@router.put("/profile")
def update_customer_profile(
    payload: CustomerProfileUpdateRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    if payload.name is not None and payload.name.strip():
        current_customer.name = payload.name.strip()
    if payload.phone is not None and payload.phone.strip():
        current_customer.phone = payload.phone.strip()
    if payload.address1 is not None:
        current_customer.address1 = payload.address1.strip()
    if payload.address2 is not None:
        current_customer.address2 = payload.address2.strip()
    if payload.city is not None:
        current_customer.city = payload.city.strip()
    if payload.state is not None:
        current_customer.state = payload.state.strip() if payload.state else None
    if payload.postcode is not None:
        current_customer.postcode = payload.postcode.strip()
    if payload.country is not None or payload.countryId is not None:
        valid_cid = resolve_country(db, payload.countryId, payload.country)
        current_customer.countryId = valid_cid
    if payload.photoUrl is not None:
        current_customer.photoUrl = payload.photoUrl.strip()

    try:
        db.commit()
        db.refresh(current_customer)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to update profile: {str(e)}"
        )
    return {
        "message": "Profile updated successfully",
        "customer": customer_to_dict(current_customer)
    }


@router.post("/profile/upload-photo")
async def upload_customer_photo(
    photo: UploadFile = File(...),
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    if not photo.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    ext = os.path.splitext(photo.filename)[1].lower()
    if not ext or ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"]:
        ext = ".jpg"

    filename = f"avatar_{current_customer.id}_{uuid.uuid4().hex[:8]}{ext}"
    target_path = AVATARS_DIR / filename

    try:
        content = await photo.read()
        with open(target_path, "wb") as f:
            f.write(content)
        
        avatar_url = f"/uploads/avatars/{filename}"
        current_customer.photoUrl = avatar_url
        db.commit()
        db.refresh(current_customer)

        return {
            "message": "Profile photo updated successfully",
            "photoUrl": avatar_url,
            "customer": customer_to_dict(current_customer)
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed saving profile photo: {err}")


# ─── Customer Booking / Inquiries ────────────────────────────────────────────

@router.post("/enquiry")
@router.post("/enquiries")
@router.post("/bookings")
def create_customer_enquiry(
    payload: CustomerEnquiryCreateRequest,
    background_tasks: BackgroundTasks,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    tracking_no = generate_tracking_number()

    # Destination country lookup
    dest_country_id = payload.receiverCountryId
    if not dest_country_id and payload.receiverCountry:
        c = db.query(Country).filter(Country.name.ilike(payload.receiverCountry.strip())).first()
        if c:
            dest_country_id = c.id
    if not dest_country_id:
        c = db.query(Country).first()
        dest_country_id = c.id if c else 1

    sender_name = payload.senderName or current_customer.name
    sender_phone = payload.senderPhone or current_customer.phone
    sender_email = payload.senderEmail or current_customer.email
    sender_address = payload.senderAddress or current_customer.address1 or "Kathmandu"
    sender_city = payload.senderCity or current_customer.city or "Kathmandu"

    enq = Enquiry(
        trackingNumber=tracking_no,
        customerId=current_customer.id,
        destinationCountry=dest_country_id,
        destinationLocation=payload.receiverCity or payload.receiverCountry,
        noOfBox=1,
        weight=payload.approximateWeight,
        status="ENQUIRY_GENERATED",
        trackingMode="MANUAL",
        isFromCustomer=True,
        isPacked=False,
        pickupRequired=payload.isPickupRequired,
        senderName=sender_name,
        senderPhone=sender_phone,
        senderEmail=sender_email,
        senderAddressLine1=sender_address,
        senderCity=sender_city,
        senderCountry="Nepal",
        receiverName=payload.receiverName,
        receiverAddressLine1=payload.receiverAddress,
        receiverCity=payload.receiverCity,
        receiverCountry=payload.receiverCountry,
        receiverTelephone=payload.receiverPhone,
        receiverEmail=payload.receiverEmail,
        receiverPostcode=payload.receiverPostcode
    )
    db.add(enq)
    db.commit()
    db.refresh(enq)

    # Add Commodity Item
    item = EnquiryItem(
        enquiryId=enq.id,
        description=payload.commodity,
        weight=payload.approximateWeight,
        quantity=1,
        unitPrice=0.0,
        totalValue=0.0
    )
    db.add(item)

    # Add Default Box (placeholder for weight; packing handled by NetPack)
    box = Box(
        enquiryId=enq.id,
        trackingNumber=f"{tracking_no}-B1",
        weight=payload.approximateWeight,
        dimensions="Standard Cargo Package (Packed by NetPack)",
        length=20.0,
        breadth=20.0,
        height=20.0,
        multiplier=1.0,
        quantity=1
    )
    db.add(box)

    # Optional Doorstep Pickup Request
    if payload.isPickupRequired:
        pickup_loc = payload.pickupAddress or sender_address
        pickup_ph = payload.pickupPhone or sender_phone
        pickup_note_str = payload.pickupNote or ""
        if payload.pickupPreferredTime:
            pickup_note_str = f"Preferred: {payload.pickupPreferredTime}. {pickup_note_str}".strip()

        pickup_entry = PickupLocationEnquiry(
            enquiryId=enq.id,
            location=pickup_loc,
            phoneNumber=pickup_ph,
            note=pickup_note_str
        )
        db.add(pickup_entry)

    # Generate milestone notification for customer
    notif = Notification(
        title="Shipment Booking Confirmed",
        body=f"Your booking for '{payload.commodity}' (~{payload.approximateWeight} kg) has been received. Tracking No: {tracking_no}. " +
             ("Doorstep pickup has been requested. " if payload.isPickupRequired else "Please drop off at our counter. ") +
             "Packing and labeling will be handled professionally by NetPack Logistics at our Central Warehouse.",
        customerId=current_customer.id,
        scope="SPECIFIC_CUSTOMER",
        isRead=False
    )
    db.add(notif)

    db.commit()
    db.refresh(enq)

    # Dispatch confirmation to sender and copy to receiver (if receiverEmail is provided)
    try:
        send_enquiry_booking_notification(enq, background_tasks)
    except Exception as em_err:
        print(f"[Email Notification Warning] {em_err}")

    return {
        "message": "Enquiry booked successfully",
        "trackingNumber": tracking_no,
        "enquiryId": enq.id,
        "commodity": payload.commodity,
        "approximateWeight": payload.approximateWeight,
        "destination": payload.receiverCountry,
        "isPickupRequired": payload.isPickupRequired,
        "status": enq.status
    }


# ─── Customer Shipments & History ────────────────────────────────────────────

@router.get("/my-shipments")
@router.get("/bookings/my")
def get_customer_shipments(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    conditions = [Enquiry.customerId == current_customer.id]
    if current_customer.userId:
        conditions.append(Enquiry.createdBy == current_customer.userId)
    if current_customer.email:
        conditions.append(Enquiry.senderEmail.ilike(current_customer.email.strip()))

    enquiries = db.query(Enquiry).filter(or_(*conditions)).order_by(Enquiry.createdAt.desc()).all()
    
    result = []
    for e in enquiries:
        # Check if converted to shipment
        linked_shipment = e.shipments[0] if (e.shipments and len(e.shipments) > 0) else None
        
        status_val = linked_shipment.status if linked_shipment else e.status
        if e.status == "PICKED_UP" and (not linked_shipment or linked_shipment.status in ("PICKED_UP", "PENDING", "ENQUIRY_GENERATED")):
            status_val = "PICKED_UP"
        hawb_val = linked_shipment.hawbno if linked_shipment else None
        fwd_no = linked_shipment.forwardingNumber if linked_shipment else None
        fwd_company = linked_shipment.forwardingCompany.name if (linked_shipment and linked_shipment.forwardingCompany) else None

        commodity_desc = e.items[0].description if (e.items and len(e.items) > 0) else "General Cargo"
        dest_name = e.receiverCountry or (e.country.name if e.country else e.destinationLocation) or "Overseas"

        is_packed = bool(
            getattr(e, "isPacked", False) or
            getattr(e, "packedAt", None) or
            (status_val in ["PACKED", "SHIPMENT_CREATED", "IN_TRANSIT", "ARRIVED_AT_HUB", "CARRIER_SCANNED", "DELIVERED"]) or
            linked_shipment
        )

        proof_images = [u.strip() for u in (e.weightProofImageUrl or "").split(",") if u.strip()]

        result.append({
            "id": e.id,
            "shipmentId": linked_shipment.id if linked_shipment else None,
            "trackingNumber": e.trackingNumber,
            "hawbno": hawb_val,
            "forwardingNumber": fwd_no,
            "forwardingCompany": fwd_company,
            "commodity": commodity_desc,
            "approximateWeight": e.weight,
            "weight": e.weight,
            "volumetricWeight": e.volumetricWeight,
            "chargeableWeight": e.chargeableWeight,
            "weightProofImageUrl": proof_images[0] if proof_images else None,
            "weightProofImages": proof_images,
            "destination": dest_name,
            "receiverName": e.receiverName,
            "receiverCity": e.receiverCity,
            "status": status_val,
            "trackingMode": getattr(e, "trackingMode", "MANUAL") or "MANUAL",
            "isPickupRequired": getattr(e, "pickupRequired", True),
            "isPacked": is_packed,
            "pickedUpAt": e.pickedUpAt.isoformat() if e.pickedUpAt else None,
            "createdAt": e.createdAt.isoformat() if e.createdAt else None,
            "updatedAt": (linked_shipment.updatedAt.isoformat() if (linked_shipment and linked_shipment.updatedAt) else (e.updatedAt.isoformat() if e.updatedAt else None))
        })

    return result


# ─── Customer Notifications ──────────────────────────────────────────────────

@router.get("/notifications")
def get_customer_notifications(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        (Notification.customerId == current_customer.id) |
        (Notification.scope == "ALL_CUSTOMERS")
    ).order_by(Notification.createdAt.desc()).limit(30).all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "isRead": n.isRead,
            "createdAt": n.createdAt.isoformat() if n.createdAt else None
        } for n in notifs
    ]


@router.patch("/notifications/{id}/read")
def mark_notification_as_read(
    id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    n = db.query(Notification).filter(Notification.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.isRead = True
    db.commit()
    return {"message": "Notification marked as read"}
