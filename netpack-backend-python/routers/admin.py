import math
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query, BackgroundTasks, Request
from services.rate_limiter import rate_limiter
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Any, Dict, Tuple
from database import get_db
from models.user import User, Role
from models.customer import Customer, PasswordResetCode
from models.location import Country
from schemas.auth import (
    LoginRequest,
    SignUpRequest,
    TokenValidationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserCreateRequest,
    UserUpdateRequest
)
from services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token,
    get_current_admin,
    get_requester_identity
)
from services.email_service import (
    send_user_welcome_email,
    send_forgot_password_email
)
from pydantic import BaseModel

class ChangePasswordPayload(BaseModel):
    currentPassword: Optional[str] = None
    oldPassword: Optional[str] = None
    newPassword: str

# In-memory store for 6-digit password reset codes: email -> (code, expiry_datetime)
_password_reset_codes: Dict[str, Tuple[str, datetime]] = {}

router = APIRouter(prefix="/api/admin", tags=["Admin"])
user_router = APIRouter(tags=["User Auth & Profile"])

@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    rate_limiter.check(request, category="admin_login", max_requests=5, window_seconds=60)
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    role_name = (user.role.name if user.role else "USER").upper()
    token_data = {
        "userId": user.id,
        "email": user.email,
        "fullName": user.fullName,
        "role": role_name,
        "roleId": user.roleId
    }
    token = create_access_token(token_data, is_admin=True)

    return {
        "message": "Login successful",
        "token": token,
        "admin": {
            "id": user.id,
            "email": user.email,
            "fullName": user.fullName,
            "emailname": user.fullName or user.email.split("@")[0],
            "phoneNumber": user.phoneNumber,
            "role": role_name
        }
    }

@router.post("/validate-token")
def validate_token(
    payload: TokenValidationRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    token = payload.token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]

    if not token:
        return {"valid": False, "message": "No token provided"}

    decoded = decode_token(token, is_admin=True)
    if not decoded:
        return {"valid": False, "message": "Invalid or expired token"}

    user_id = decoded.get("userId") or decoded.get("id")
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if not user:
        return {"valid": False, "message": "User not found"}

    role_name = (user.role.name if user.role else "USER").upper()
    return {
        "valid": True,
        "message": "Token is valid",
        "admin": {
            "id": user.id,
            "email": user.email,
            "fullName": user.fullName,
            "emailname": user.fullName or user.email.split("@")[0],
            "phoneNumber": user.phoneNumber,
            "role": role_name
        }
    }

@router.post("/validate-mobile-token")
def validate_mobile_token(payload: TokenValidationRequest, db: Session = Depends(get_db)):
    return validate_token(payload, None, db)

@router.post("/forgot-password")
@router.post("/forgot-password/")
@router.post("/forgotPassword")
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    rate_limiter.check(request, category="forgot_password", max_requests=3, window_seconds=60)
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    cust = db.query(Customer).filter(Customer.email.ilike(clean_email)).first()
    if not user and not cust:
        return {"message": "If the email exists, a password reset link has been sent.", "success": True}

    # Generate 6-digit verification code with 15-minute expiration
    reset_code = f"{random.randint(100000, 999999)}"
    _password_reset_codes[clean_email] = (reset_code, datetime.utcnow() + timedelta(minutes=15))

    # Persist in DB for serverless multi-instance resilience
    try:
        db.query(PasswordResetCode).filter(PasswordResetCode.email == clean_email).delete()
        db.add(PasswordResetCode(
            email=clean_email,
            code=reset_code,
            expiresAt=datetime.utcnow() + timedelta(minutes=15)
        ))
        db.commit()
    except Exception as e:
        print(f"[ForgotPassword DB Warning] Could not persist reset code to DB: {e}")
        db.rollback()

    full_name = (user.fullName if user else None) or (cust.name if cust else "User")
    target_email = user.email if user else cust.email
    send_forgot_password_email(
        to_email=target_email,
        full_name=full_name,
        reset_code=reset_code,
        background_tasks=background_tasks
    )
    return {"message": "Password reset email sent successfully", "success": True, "email": clean_email}

@router.post("/reset-password")
@router.post("/reset-password/")
@router.post("/resetPassword")
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    rate_limiter.check(request, category="reset_password", max_requests=5, window_seconds=60)
    clean_email = payload.email.strip().lower()
    clean_code = payload.code.strip()
    new_password = (payload.newPassword or payload.password or "").strip()

    if not new_password or len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Query DB record first (resilient across serverless instances)
    db_record = None
    try:
        db_record = db.query(PasswordResetCode).filter(PasswordResetCode.email == clean_email).order_by(PasswordResetCode.id.desc()).first()
    except Exception as e:
        print(f"[ResetPassword DB Note] {e}")

    if db_record:
        if datetime.utcnow() > db_record.expiresAt:
            try:
                db.delete(db_record)
                db.commit()
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )
        if db_record.code != clean_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect verification code. Please check your email and try again."
            )
    else:
        # Fallback to in-memory store
        stored = _password_reset_codes.get(clean_email)
        if not stored:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code. Please request a new code."
            )

        stored_code, expiry = stored
        if datetime.utcnow() > expiry:
            _password_reset_codes.pop(clean_email, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )

        if stored_code != clean_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect verification code. Please check your email and try again."
            )

    hashed_pw = get_password_hash(new_password)
    updated = False

    # Update User password if exists
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if user:
        user.password = hashed_pw
        updated = True

    # Update Customer password if exists (either by email or linked userId)
    cust = db.query(Customer).filter(Customer.email.ilike(clean_email)).first()
    if cust:
        cust.password = hashed_pw
        updated = True
    elif user:
        linked_cust = db.query(Customer).filter(Customer.userId == user.id).first()
        if linked_cust:
            linked_cust.password = hashed_pw
            updated = True

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found."
        )

    if db_record:
        try:
            db.delete(db_record)
        except Exception:
            pass
    _password_reset_codes.pop(clean_email, None)
    db.commit()

    return {
        "message": "Password reset successfully! You can now log in with your new password.",
        "success": True
    }

def process_change_password(payload: ChangePasswordPayload, authorization: Optional[str], db: Session):
    requester = get_requester_identity(authorization, db)
    if not requester.is_authenticated or not (requester.user or requester.customer):
        raise HTTPException(status_code=401, detail="Authentication required to change password.")

    current_pw = (payload.currentPassword or payload.oldPassword or "").strip()
    new_pw = (payload.newPassword or "").strip()

    if not new_pw or len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    target_hash = None
    if requester.user and requester.user.password:
        target_hash = requester.user.password
    elif requester.customer and getattr(requester.customer, "password", None):
        target_hash = requester.customer.password

    if not target_hash or not verify_password(current_pw, target_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    hashed = get_password_hash(new_pw)
    if requester.user:
        requester.user.password = hashed

    # Also update linked Customer record if one exists
    cust = None
    if requester.user:
        cust = db.query(Customer).filter(Customer.userId == requester.user.id).first()
        if not cust and requester.user.email:
            cust = db.query(Customer).filter(Customer.email == requester.user.email).first()
    elif requester.customer:
        cust = requester.customer

    if cust:
        cust.password = hashed

    db.commit()
    return {"success": True, "message": "Password changed successfully"}

@router.post("/change-password")
@router.post("/change-password/")
@router.post("/user/changepassword")
@router.post("/user/changepassword/")
def admin_change_password(
    payload: ChangePasswordPayload,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    return process_change_password(payload, authorization, db)

@user_router.post("/user/changepassword")
@user_router.post("/user/changepassword/")
@user_router.post("/user/change-password")
@user_router.post("/user/change-password/")
@user_router.post("/users/change-password")
@user_router.post("/users/change-password/")
@user_router.post("/api/user/changepassword")
@user_router.post("/api/user/changepassword/")
@user_router.post("/api/user/change-password")
@user_router.post("/api/user/change-password/")
@user_router.post("/api/users/change-password")
@user_router.post("/api/users/change-password/")
def global_change_password(
    payload: ChangePasswordPayload,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    return process_change_password(payload, authorization, db)

@user_router.get("/api/users/me")
def get_current_user_me(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    requester = get_requester_identity(authorization, db)
    if not requester.is_authenticated or not requester.user:
        raise HTTPException(status_code=401, detail="Authentication required")
    u = requester.user
    role_name = (u.role.name if u.role else "USER").upper()
    return {
        "admin": {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "fullName": u.fullName,
            "phoneNumber": u.phoneNumber,
            "isActive": u.isActive,
            "role": role_name,
            "roleId": u.roleId,
            "createdAt": u.createdAt.isoformat() if u.createdAt else None,
            "updatedAt": u.updatedAt.isoformat() if u.updatedAt else None,
            "address1": u.address1,
            "address2": u.address2,
            "city": u.city,
            "state": u.state,
            "postcode": u.postcode,
            "countryId": u.countryId,
            "isOrganization": u.isOrganization or False,
            "organizationName": u.organizationName
        }
    }

@router.post("/signUp")
@router.post("/signUp/")
@router.post("/signup")
@router.post("/signup/")
def sign_up(
    payload: SignUpRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    clean_email = payload.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    existing_cust = db.query(Customer).filter(func.lower(Customer.email) == clean_email).first()
    if existing_user or existing_cust:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in instead."
        )

    # Portal signup is strictly for Users (Cargo Couriers). Never allow public elevation to ADMIN.
    user_role = db.query(Role).filter(Role.name == "USER").first()
    role_id = user_role.id if user_role else 3

    # Resolve countryId safely
    country_id = 1
    if payload.countryId:
        try:
            country_id = int(payload.countryId)
        except (ValueError, TypeError):
            country_id = 1

    hashed_pw = get_password_hash(payload.password)
    user = User(
        email=payload.email.strip(),
        password=hashed_pw,
        fullName=payload.fullName or payload.email.split("@")[0],
        phoneNumber=payload.phoneNumber,
        address1=payload.address1,
        address2=payload.address2,
        city=payload.city,
        state=payload.state,
        postcode=payload.postcode,
        countryId=country_id,
        isOrganization=payload.isOrganization or False,
        organizationName=payload.organizationName,
        roleId=role_id,
        isActive=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically ensure user is registered as a Customer ONLY for customer/client roles (NOT internal staff like PICKUP, RIDER, ADMIN, CSD, OPERATION)
    role_name = (user_role.name if user_role else "").upper()
    is_internal_staff = role_name in ("PICKUP", "RIDER", "ADMIN", "SUPER_ADMIN", "OPERATION", "CSD")
    if not is_internal_staff:
        from models.customer import Customer
        cust = db.query(Customer).filter(Customer.userId == user.id).first()
        if not cust and user.email:
            cust = db.query(Customer).filter(Customer.email == user.email).first()
        if not cust:
            c = Customer(
                name=user.fullName or user.email.split("@")[0],
                phone=user.phoneNumber or "+977-00000000",
                email=user.email,
                address1=payload.address1,
                address2=payload.address2,
                city=payload.city,
                state=payload.state,
                postcode=payload.postcode,
                countryId=country_id,
                isOrganization=payload.isOrganization or False,
                organizationName=payload.organizationName,
                userId=user.id
            )
            db.add(c)
            db.commit()
    else:
        # Update existing customer record with provided signup address
        if payload.address1:
            cust.address1 = payload.address1
        if payload.address2:
            cust.address2 = payload.address2
        if payload.city:
            cust.city = payload.city
        if payload.state:
            cust.state = payload.state
        if payload.postcode:
            cust.postcode = payload.postcode
        if country_id:
            cust.countryId = country_id
        if payload.isOrganization is not None:
            cust.isOrganization = payload.isOrganization
        if payload.organizationName:
            cust.organizationName = payload.organizationName
        cust.userId = user.id
        db.commit()

    # Dispatch welcome & account confirmation email
    send_user_welcome_email(
        to_email=user.email,
        full_name=user.fullName,
        role_name="CUSTOMER",
        password=payload.password,
        background_tasks=background_tasks
    )

    return {"message": "User created successfully", "userId": user.id}

@router.get("/users")
def get_all_admins(
    limit: int = 10,
    page: int = 1,
    skip: int = 0,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    q = db.query(User)
    if search:
        s = f"%{search}%"
        q = q.filter(
            (User.fullName.ilike(s)) |
            (User.email.ilike(s)) |
            (User.phoneNumber.ilike(s))
        )
    total = q.count()
    users = q.offset(skip).limit(limit).all() if limit > 0 else q.all()
    res = []
    for u in users:
        role_name = (u.role.name if u.role else "USER").upper()
        res.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "fullName": u.fullName,
            "phoneNumber": u.phoneNumber,
            "isActive": u.isActive,
            "role": role_name,
            "createdAt": u.createdAt.isoformat() if u.createdAt else None,
            "updatedAt": u.updatedAt.isoformat() if u.updatedAt else None,
            "address1": u.address1,
            "address2": u.address2,
            "city": u.city,
            "state": u.state,
            "postcode": u.postcode,
            "country": u.country.name if u.country else None,
            "countryId": u.countryId,
            "isOrganization": u.isOrganization or False,
            "organizationName": u.organizationName
        })
    total_pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
    return {
        "admins": res,
        "pagination": {
            "total": total,
            "totalPages": total_pages,
            "page": page,
            "limit": limit
        }
    }

@router.get("/users/{id}")
def get_admin_by_id(
    id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    requester = get_requester_identity(authorization, db)
    if not requester.is_authenticated:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not (requester.is_staff or (requester.user and requester.user.id == id)):
        raise HTTPException(status_code=403, detail="Permission denied")

    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    # Link with customer record if available to guarantee no missing fields
    cust = db.query(Customer).filter(Customer.userId == u.id).first()
    if not cust and u.email:
        cust = db.query(Customer).filter(Customer.email == u.email).first()

    fn = u.fullName or (cust.name if cust else None) or u.username or (u.email.split("@")[0] if u.email else "")
    em = u.email or (cust.email if cust else "")
    ph = u.phoneNumber or (cust.phone if cust else "")
    a1 = u.address1 or (cust.address1 if cust else "")
    a2 = u.address2 or (getattr(cust, "address2", None) if cust else "")
    ct = u.city or (cust.city if cust else "")
    st = u.state or (cust.state if cust else "")
    pc = u.postcode or (cust.postcode if cust else "")
    cid = u.countryId or (cust.countryId if cust else None)
    is_org = u.isOrganization or (cust.isOrganization if cust else False)
    org_name = u.organizationName or (cust.organizationName if cust else "")

    # Backfill missing User columns from Customer so they persist
    updated_u = False
    if not u.fullName and fn:
        u.fullName = fn
        updated_u = True
    if not u.phoneNumber and ph:
        u.phoneNumber = ph
        updated_u = True
    if not u.address1 and a1:
        u.address1 = a1
        updated_u = True
    if not u.city and ct:
        u.city = ct
        updated_u = True
    if not u.state and st:
        u.state = st
        updated_u = True
    if not u.postcode and pc:
        u.postcode = pc
        updated_u = True
    if not u.countryId and cid:
        u.countryId = cid
        updated_u = True
    if updated_u:
        try:
            db.commit()
        except Exception:
            db.rollback()

    role_name = (u.role.name if u.role else "USER").upper()
    user_dict = {
        "id": u.id,
        "username": u.username,
        "email": em,
        "fullName": fn,
        "phoneNumber": ph,
        "isActive": u.isActive,
        "role": role_name,
        "roleId": u.roleId,
        "createdAt": u.createdAt.isoformat() if u.createdAt else None,
        "updatedAt": u.updatedAt.isoformat() if u.updatedAt else None,
        "address1": a1,
        "address2": a2,
        "city": ct,
        "state": st,
        "postcode": pc,
        "countryId": cid,
        "isOrganization": is_org,
        "organizationName": org_name
    }
    return {
        "admin": user_dict,
        "user": user_dict,
        **user_dict
    }

@router.post("/create")
@router.post("/create/")
@router.post("/users")
@router.post("/users/")
def create_admin_user(
    payload: UserCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    clean_email = payload.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    existing_cust = db.query(Customer).filter(func.lower(Customer.email) == clean_email).first()
    if existing_user or existing_cust:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    # Resolve role
    role_id = None
    if payload.roleId:
        try:
            role_id = int(payload.roleId)
        except (ValueError, TypeError):
            pass
    if not role_id and payload.role:
        r = db.query(Role).filter(Role.name.ilike(payload.role)).first()
        if r:
            role_id = r.id
    if not role_id:
        user_role = db.query(Role).filter(Role.name == "USER").first()
        role_id = user_role.id if user_role else None
        if not role_id:
            first_role = db.query(Role).first()
            role_id = first_role.id if first_role else None

    # Resolve countryId
    country_id = None
    if payload.countryId:
        try:
            country_id = int(payload.countryId)
        except (ValueError, TypeError):
            country_id = None

    password_to_hash = payload.password or "Netpack@123"
    hashed_pw = get_password_hash(password_to_hash)
    u = User(
        email=payload.email.strip(),
        username=payload.username.strip() if payload.username else None,
        password=hashed_pw,
        fullName=payload.fullName or payload.email.split("@")[0],
        phoneNumber=payload.phoneNumber,
        roleId=role_id,
        isOrganization=payload.isOrganization or False,
        organizationName=payload.organizationName,
        address1=payload.address1,
        address2=payload.address2,
        city=payload.city,
        state=payload.state,
        postcode=payload.postcode,
        countryId=country_id,
        isActive=True
    )
    db.add(u)
    db.commit()
    db.refresh(u)

    # Automatically ensure user is represented in customers table ONLY if user is a customer/courier (NOT staff/pickup)
    role_check_str = (payload.role or (u.role.name if u.role else "STAFF")).upper()
    if role_check_str not in ("PICKUP", "RIDER", "ADMIN", "SUPER_ADMIN", "OPERATION", "CSD"):
        try:
            first_c = db.query(Country).first()
            target_country_id = u.countryId or (first_c.id if first_c else 1)
            cust = Customer(
                name=u.fullName or u.email.split("@")[0],
                phone=u.phoneNumber or "+977-00000000",
                email=u.email,
                isOrganization=u.isOrganization or False,
                organizationName=u.organizationName,
                address1=u.address1,
                city=u.city,
                state=u.state,
                countryId=target_country_id,
                postcode=u.postcode,
                userId=u.id
            )
            db.add(cust)
            db.commit()
        except Exception as err:
            print(f"[Warning] Failed syncing user to customer: {err}")
            db.rollback()

    # Dispatch welcome email with login credentials
    role_str = payload.role or (u.role.name if u.role else "STAFF")
    send_user_welcome_email(
        to_email=u.email,
        full_name=u.fullName,
        role_name=role_str,
        password=password_to_hash,
        background_tasks=background_tasks
    )

    return {"message": "User created successfully", "user": {"id": u.id, "email": u.email, "username": u.username}}

@router.put("/users/{id}")
@router.put("/users/{id}/")
@router.patch("/users/{id}")
@router.patch("/users/{id}/")
def update_admin(
    id: int,
    payload: UserUpdateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    requester = get_requester_identity(authorization, db)
    if not requester.is_authenticated:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not (requester.is_staff or (requester.user and requester.user.id == id)):
        raise HTTPException(status_code=403, detail="Permission denied")

    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        if payload.username is not None and str(payload.username).strip():
            u.username = str(payload.username).strip()
        if payload.fullName is not None and str(payload.fullName).strip():
            u.fullName = str(payload.fullName).strip()
        if payload.phoneNumber is not None and str(payload.phoneNumber).strip():
            u.phoneNumber = str(payload.phoneNumber).strip()

        # Update role & active status (Staff only)
        if requester.is_staff:
            if payload.roleId is not None:
                try:
                    u.roleId = int(payload.roleId)
                except (ValueError, TypeError):
                    pass
            elif payload.role is not None:
                r = db.query(Role).filter(Role.name.ilike(payload.role)).first()
                if r:
                    u.roleId = r.id
            if payload.isActive is not None:
                u.isActive = payload.isActive

        if payload.countryId is not None:
            try:
                u.countryId = int(payload.countryId) if payload.countryId else None
            except (ValueError, TypeError):
                u.countryId = None

        if payload.email is not None and str(payload.email).strip() and requester.is_staff:
            u.email = str(payload.email).strip()
        if payload.password and str(payload.password).strip():
            u.password = get_password_hash(str(payload.password).strip())
        if payload.isOrganization is not None:
            u.isOrganization = payload.isOrganization
        if payload.organizationName is not None:
            u.organizationName = str(payload.organizationName).strip() if payload.organizationName else None
        if payload.address1 is not None and str(payload.address1).strip():
            u.address1 = str(payload.address1).strip()
        if payload.address2 is not None:
            u.address2 = str(payload.address2).strip() if payload.address2 else None
        if payload.city is not None and str(payload.city).strip():
            u.city = str(payload.city).strip()
        if payload.state is not None and str(payload.state).strip():
            u.state = str(payload.state).strip()
        if payload.postcode is not None and str(payload.postcode).strip():
            u.postcode = str(payload.postcode).strip()

        # Sync linked customer
        cust = db.query(Customer).filter(Customer.userId == u.id).first()
        if not cust and u.email:
            cust = db.query(Customer).filter(Customer.email == u.email).first()

        if cust:
            if u.fullName: cust.name = u.fullName
            if u.phoneNumber: cust.phone = u.phoneNumber
            if u.email and not cust.email: cust.email = u.email
            if u.isOrganization is not None: cust.isOrganization = u.isOrganization
            if u.organizationName is not None: cust.organizationName = u.organizationName
            if u.address1: cust.address1 = u.address1
            if u.address2 is not None: cust.address2 = u.address2
            if u.city: cust.city = u.city
            if u.state: cust.state = u.state
            if u.countryId: cust.countryId = u.countryId
            if u.postcode: cust.postcode = u.postcode
            cust.userId = u.id
        else:
            first_c = db.query(Country).first()
            target_country_id = u.countryId or (first_c.id if first_c else 1)
            new_cust = Customer(
                name=u.fullName or (u.email.split("@")[0] if u.email else "Customer"),
                phone=u.phoneNumber or "+977-00000000",
                email=u.email,
                isOrganization=u.isOrganization or False,
                organizationName=u.organizationName,
                address1=u.address1,
                address2=u.address2,
                city=u.city,
                state=u.state,
                countryId=target_country_id,
                postcode=u.postcode,
                userId=u.id
            )
            db.add(new_cust)

        db.commit()
        db.refresh(u)
        return {"message": "User updated successfully", "id": u.id}
    except Exception as err:
        db.rollback()
        print(f"[Error in update_admin] {err}")
        raise HTTPException(status_code=400, detail=f"Failed to update profile: {str(err)}")

@router.delete("/users/{id}")
def delete_admin(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(u)
    db.commit()
    return {"message": "User deleted successfully"}

@router.patch("/users/{id}/active")
def make_admin_active(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.isActive = True
    db.commit()
    return {"message": "User activated"}

@router.patch("/users/{id}/inactive")
def make_admin_inactive(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.isActive = False
    db.commit()
    return {"message": "User deactivated"}
