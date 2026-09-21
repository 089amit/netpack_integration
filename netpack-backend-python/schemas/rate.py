from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class RateCalculatorRequest(BaseModel):
    weight: float
    destination: str

class SurchargeUpdateRequest(BaseModel):
    rate: float

class RateCreateRequest(BaseModel):
    id: Optional[int] = None
    weightFrom: float
    weightTo: float
    rate: float
    isPerKg: bool = False
    countryId: Optional[int] = None
    zoneId: Optional[int] = None
    serviceId: Optional[int] = None
    countryName: Optional[str] = None
    zoneName: Optional[str] = None

class RateUpdateRequest(BaseModel):
    id: Optional[int] = None
    weightFrom: Optional[float] = None
    weightTo: Optional[float] = None
    rate: Optional[float] = None
    isPerKg: Optional[bool] = None
    countryId: Optional[int] = None
    zoneId: Optional[int] = None
    serviceId: Optional[int] = None
    countryName: Optional[str] = None
    zoneName: Optional[str] = None

class AreaSurchargeCheckRequest(BaseModel):
    countryId: Optional[int] = None
    countryCode: Optional[str] = None
    postalCode: Optional[str] = None
    locationName: Optional[str] = None
