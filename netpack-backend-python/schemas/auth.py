from pydantic import BaseModel, EmailStr
from typing import Optional, Any, Dict

class LoginRequest(BaseModel):
    email: str
    password: str

class SignUpRequest(BaseModel):
    email: str
    password: str
    fullName: Optional[str] = None
    phoneNumber: Optional[str] = None
    roleId: Optional[int] = None

class TokenValidationRequest(BaseModel):
    token: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class UserCreateRequest(BaseModel):
    email: str
    username: Optional[str] = None
    password: Optional[str] = "Netpack@123"
    fullName: Optional[str] = None
    phoneNumber: Optional[str] = None
    role: Optional[str] = None
    roleId: Optional[Any] = None
    isOrganization: Optional[bool] = False
    organizationName: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    countryId: Optional[Any] = None

class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    fullName: Optional[str] = None
    phoneNumber: Optional[str] = None
    role: Optional[str] = None
    roleId: Optional[Any] = None
    email: Optional[str] = None
    password: Optional[str] = None
    isActive: Optional[bool] = None
    isOrganization: Optional[bool] = None
    organizationName: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    countryId: Optional[Any] = None

class RiderLoginRequest(BaseModel):
    identifier: str
    password: str

