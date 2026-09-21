from pydantic import BaseModel
from typing import Optional, List, Any

class BulkShipmentsFromEnquiriesRequest(BaseModel):
    enquiryIds: Optional[List[Any]] = None
    ids: Optional[List[Any]] = None

    class Config:
        extra = "allow"

class BulkStatusChangeRequest(BaseModel):
    shipmentIds: Optional[List[Any]] = None
    id: Optional[List[Any]] = None
    status: str

    class Config:
        extra = "allow"

class BatchAddNoteRequest(BaseModel):
    shipmentIds: Optional[List[Any]] = None
    id: Optional[List[Any]] = None
    note: str

    class Config:
        extra = "allow"

class ShipmentStatusUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = None
    location: Optional[str] = None

    class Config:
        extra = "allow"

class AssignAgentRequest(BaseModel):
    agentId: Optional[Any] = None
    agentCode: Optional[str] = None
    hawbno: Optional[str] = None

    class Config:
        extra = "allow"

class ShipmentUpdateRequest(BaseModel):
    status: Optional[str] = None
    forwardingCompanyId: Optional[Any] = None
    serviceId: Optional[Any] = None
    mawbId: Optional[Any] = None
    countryId: Optional[Any] = None
    customerId: Optional[Any] = None
    agentId: Optional[Any] = None
    agent: Optional[str] = None
    forwardingNumber: Optional[str] = None
    note: Optional[str] = None
    hawbno: Optional[str] = None
    hawbNumber: Optional[str] = None
    destinationCountryName: Optional[str] = None
    forwardingCompanyName: Optional[str] = None
    serviceName: Optional[str] = None
    reciverName: Optional[str] = None
    trackingMode: Optional[str] = None

    class Config:
        extra = "allow"
