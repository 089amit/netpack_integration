import math
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from database import get_db
from models.user import User, Role
from models.customer import Customer
from models.location import Country
from schemas.auth import (
    LoginRequest,
    SignUpRequest,
    TokenValidationRequest,
    ForgotPasswordRequest,
    UserCreateRequest,
    UserUpdateRequest
)
from services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token,
    get_current_admin
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
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

    role_name = user.role.name if user.role else "ADMIN"
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

    role_name = user.role.name if user.role else "ADMIN"
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
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return {"message": "If the email exists, a password reset link has been sent."}
    return {"message": "Password reset email sent successfully"}

@router.post("/signUp")
def sign_up(payload: SignUpRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role_id = payload.roleId
    if not role_id:
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        role_id = admin_role.id if admin_role else None

    hashed_pw = get_password_hash(payload.password)
    user = User(
        email=payload.email,
        password=hashed_pw,
        fullName=payload.fullName or payload.email.split("@")[0],
        phoneNumber=payload.phoneNumber,
        roleId=role_id,
        isActive=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

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
        role_name = u.role.name if u.role else "ADMIN"
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
def get_admin_by_id(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    role_name = u.role.name if u.role else "ADMIN"
    return {
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

@router.post("/create")
def create_admin_user(payload: UserCreateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

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
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        role_id = admin_role.id if admin_role else None

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
        email=payload.email,
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

    # Automatically ensure user is also represented in customers table
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

    return {"message": "User created successfully", "user": {"id": u.id, "email": u.email, "username": u.username}}

@router.put("/users/{id}")
def update_admin(id: int, payload: UserUpdateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.username is not None:
        u.username = payload.username.strip() if payload.username else None
    if payload.fullName is not None:
        u.fullName = payload.fullName
    if payload.phoneNumber is not None:
        u.phoneNumber = payload.phoneNumber

    # Update role
    if payload.roleId is not None:
        try:
            u.roleId = int(payload.roleId)
        except (ValueError, TypeError):
            pass
    elif payload.role is not None:
        r = db.query(Role).filter(Role.name.ilike(payload.role)).first()
        if r:
            u.roleId = r.id

    if payload.countryId is not None:
        try:
            u.countryId = int(payload.countryId) if payload.countryId else None
        except (ValueError, TypeError):
            u.countryId = None

    if payload.email is not None:
        u.email = payload.email
    if payload.password:
        u.password = get_password_hash(payload.password)
    if payload.isActive is not None:
        u.isActive = payload.isActive
    if payload.isOrganization is not None:
        u.isOrganization = payload.isOrganization
    if payload.organizationName is not None:
        u.organizationName = payload.organizationName
    if payload.address1 is not None:
        u.address1 = payload.address1
    if payload.address2 is not None:
        u.address2 = payload.address2
    if payload.city is not None:
        u.city = payload.city
    if payload.state is not None:
        u.state = payload.state
    if payload.postcode is not None:
        u.postcode = payload.postcode

    # Sync linked customer
    cust = db.query(Customer).filter(Customer.userId == u.id).first()
    if cust:
        if payload.fullName is not None: cust.name = payload.fullName
        if payload.phoneNumber is not None: cust.phone = payload.phoneNumber
        if payload.email is not None: cust.email = payload.email
        if payload.isOrganization is not None: cust.isOrganization = payload.isOrganization
        if payload.organizationName is not None: cust.organizationName = payload.organizationName
        if payload.address1 is not None: cust.address1 = payload.address1
        if payload.city is not None: cust.city = payload.city
        if payload.state is not None: cust.state = payload.state
        if payload.countryId is not None and u.countryId: cust.countryId = u.countryId
        if payload.postcode is not None: cust.postcode = payload.postcode

    db.commit()
    db.refresh(u)
    return {"message": "User updated successfully", "id": u.id}

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
