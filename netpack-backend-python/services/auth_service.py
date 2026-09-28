from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import config
from database import get_db
from models.user import User

security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def create_access_token(data: dict, is_admin: bool = True, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    secret = config.JWT_ADMIN_SECRET if is_admin else config.JWT_SECRET
    return jwt.encode(to_encode, secret, algorithm=config.JWT_ALGORITHM)

def decode_token(token: str, is_admin: bool = True) -> Optional[Dict[str, Any]]:
    secret = config.JWT_ADMIN_SECRET if is_admin else config.JWT_SECRET
    try:
        payload = jwt.decode(token, secret, algorithms=[config.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def decode_any_token(token: str) -> Optional[Dict[str, Any]]:
    payload = decode_token(token, is_admin=True)
    if payload:
        return payload
    return decode_token(token, is_admin=False)

async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: No token provided"
        )
    token = credentials.credentials
    payload = decode_token(token, is_admin=True)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid admin token"
        )
    user_id = payload.get("userId") or payload.get("id") or payload.get("adminId")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token structure"
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

async def get_current_user_any(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: No token provided"
        )
    token = credentials.credentials
    payload = decode_any_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid token"
        )
    return payload


class RequesterIdentity:
    def __init__(
        self,
        user: Optional[User] = None,
        customer: Optional[Any] = None,
        role: str = "ANONYMOUS",
        is_authenticated: bool = False
    ):
        self.user = user
        self.customer = customer
        self.role = (role or "ANONYMOUS").upper().strip()
        self.is_authenticated = is_authenticated
        self.is_admin = (self.role == "ADMIN")
        self.is_staff = self.role in ("ADMIN", "OPERATION", "OPERATIONS", "CSD", "ACCOUNTS")
        self.is_rider = (self.role == "PICKUP")
        # Cargo couriers (USER) and End Customers (CUSTOMER)
        self.is_user_or_customer = (
            self.role in ("USER", "CUSTOMER") or
            (self.is_authenticated and not self.is_staff and not self.is_rider)
        )


def get_requester_identity(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> RequesterIdentity:
    """
    Safely resolves the authenticated entity (User or Customer) and their role from the Authorization header.
    Returns RequesterIdentity with role='ANONYMOUS' if unauthenticated.
    """
    if not authorization:
        return RequesterIdentity()

    token = authorization
    if token.startswith("Bearer "):
        token = token.split(" ", 1)[1].strip()
    else:
        token = token.strip()

    if not token:
        return RequesterIdentity()

    decoded = decode_any_token(token)
    if not decoded:
        return RequesterIdentity()

    from models.customer import Customer

    user_id = decoded.get("userId") or decoded.get("id") or decoded.get("adminId")
    email = decoded.get("email")
    role_claim = (decoded.get("role") or "").upper().strip()

    user = None
    if user_id:
        try:
            user = db.query(User).filter(User.id == int(user_id)).first()
        except Exception:
            user = None
    if not user and email:
        user = db.query(User).filter(User.email.ilike(email.strip())).first()

    customer = None
    if user:
        role_name = (user.role.name if user.role else (role_claim or "USER")).upper().strip()
        customer = db.query(Customer).filter(Customer.userId == user.id).first()
        if not customer and user.email:
            customer = db.query(Customer).filter(Customer.email.ilike(user.email.strip())).first()
        if not customer and user.phoneNumber:
            customer = db.query(Customer).filter(Customer.phone == user.phoneNumber.strip()).first()
    else:
        cust_id = decoded.get("customerId") or decoded.get("id")
        if cust_id:
            try:
                customer = db.query(Customer).filter(Customer.id == int(cust_id)).first()
            except Exception:
                customer = None
        if not customer and email:
            customer = db.query(Customer).filter(Customer.email.ilike(email.strip())).first()
        role_name = "CUSTOMER" if customer else (role_claim or "ANONYMOUS")

    return RequesterIdentity(
        user=user,
        customer=customer,
        role=role_name,
        is_authenticated=True
    )


def get_user_enquiry_filter(requester: RequesterIdentity):
    """
    Builds an SQLAlchemy filter expression that scopes enquiries/pickups
    strictly to those created, requested, or associated with the user/customer.
    """
    from models.enquiry import Enquiry
    from sqlalchemy import or_

    filters = []
    if requester.user:
        filters.append(Enquiry.createdBy == requester.user.id)
        if requester.user.email:
            filters.append(Enquiry.senderEmail.ilike(requester.user.email.strip()))
        if requester.user.phoneNumber:
            filters.append(Enquiry.senderPhone == requester.user.phoneNumber.strip())

    if requester.customer:
        filters.append(Enquiry.customerId == requester.customer.id)
        if requester.customer.email:
            filters.append(Enquiry.senderEmail.ilike(requester.customer.email.strip()))
        if requester.customer.phone:
            filters.append(Enquiry.senderPhone == requester.customer.phone.strip())

    if filters:
        return or_(*filters)
    return Enquiry.id == -1

