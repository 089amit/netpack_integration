from pydantic import BaseModel
from typing import Optional, List, Any

class CountryCreateRequest(BaseModel):
    name: str
    boxWeightLimit: Optional[float] = None
    zoneId: Optional[Any] = None
    isActive: Optional[bool] = True

class CountryUpdateRequest(BaseModel):
    name: Optional[str] = None
    boxWeightLimit: Optional[float] = None
    zoneId: Optional[Any] = None
    isActive: Optional[bool] = None

class CityCreateRequest(BaseModel):
    name: str
    countryId: int

class CityUpdateRequest(BaseModel):
    name: Optional[str] = None
    countryId: Optional[int] = None

class ZoneCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    weightLimit: Optional[float] = None
    countryIds: Optional[List[int]] = None

class ZoneUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    weightLimit: Optional[float] = None
    countryIds: Optional[List[int]] = None

class PolicyCreateRequest(BaseModel):
    title: str
    slug: str
    content: str
    isActive: Optional[bool] = True

class PolicyUpdateRequest(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    isActive: Optional[bool] = None
