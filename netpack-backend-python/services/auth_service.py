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
