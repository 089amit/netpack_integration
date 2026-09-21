from pydantic import BaseModel
from typing import Optional

class CustomerCreateRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    gender: Optional[str] = None
    isOrganization: Optional[bool] = False
    organizationName: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    countryId: int
    postcode: Optional[str] = None
    password: Optional[str] = None

class CustomerUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    isOrganization: Optional[bool] = None
    organizationName: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    countryId: Optional[int] = None
    postcode: Optional[str] = None
