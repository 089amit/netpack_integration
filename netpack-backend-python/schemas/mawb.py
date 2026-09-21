from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class MawbCreateRequest(BaseModel):
    mawbNumber: str
    departureDate: Optional[datetime] = None
    airlineName: Optional[str] = None
    destination: Optional[str] = None
    agentId: Optional[int] = None
    dateOfArrival: Optional[datetime] = None
    flightNumber: Optional[str] = None
    timeOfArrival: Optional[str] = None

    class Config:
        extra = "allow"

class MawbUpdateRequest(BaseModel):
    mawbNumber: Optional[str] = None
    departureDate: Optional[datetime] = None
    airlineName: Optional[str] = None
    destination: Optional[str] = None
    agentId: Optional[int] = None
    dateOfArrival: Optional[datetime] = None
    flightNumber: Optional[str] = None
    timeOfArrival: Optional[str] = None

    class Config:
        extra = "allow"

class LinkEnquiryToMawbRequest(BaseModel):
    mawbId: Any
    enquiryIds: Optional[List[Any]] = None
    shipmentIds: Optional[List[Any]] = None

    class Config:
        extra = "allow"
