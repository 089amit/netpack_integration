from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class ItemSchema(BaseModel):
    id: Optional[int] = None
    description: Optional[str] = None
    weight: Optional[Any] = None
    value: Optional[Any] = None
    quantity: Optional[Any] = None
    unitPrice: Optional[Any] = None
    hsCode: Optional[str] = None
    totalValue: Optional[Any] = None

    class Config:
        extra = "allow"

class BoxItemSchema(BaseModel):
    enquiryItemId: int
    quantity: int = 1

    class Config:
        extra = "allow"

class BoxSchema(BaseModel):
    id: Optional[int] = None
    trackingNumber: Optional[str] = None
    weight: Optional[Any] = None
    dimensions: Optional[str] = None
    length: Optional[Any] = None
    breadth: Optional[Any] = None
    height: Optional[Any] = None
    multiplier: Optional[Any] = None
    quantity: Optional[Any] = None
    value: Optional[Any] = None
    items: Optional[List[BoxItemSchema]] = None

    class Config:
        extra = "allow"

class PickupLocationSchema(BaseModel):
    location: str
    phoneNumber: Optional[str] = None
    note: Optional[str] = None

    class Config:
        extra = "allow"

class EnquiryCreateRequest(BaseModel):
    customerId: Optional[Any] = None
    receiverName: Optional[str] = None
    receiverAddressLine1: Optional[str] = None
    receiverAddressLine2: Optional[str] = None
    receiverPostcode: Optional[str] = None
    receiverCountryId: Optional[Any] = None
    receiverCountry: Optional[str] = None
    receiverTelephone: Optional[str] = None
    receiverState: Optional[str] = None
    receiverCity: Optional[str] = None
    receiverEmail: Optional[str] = None
    receivercompanyName: Optional[str] = None

    senderName: Optional[str] = None
    senderAddressLine1: Optional[str] = None
    senderAddressLine2: Optional[str] = None
    senderPostcode: Optional[str] = None
    senderCountry: Optional[str] = None
    senderPhone: Optional[str] = None
    senderEmail: Optional[str] = None
    senderCity: Optional[str] = None

    destinationLocation: Optional[str] = None
    destinationCountry: Optional[Any] = None
    pinCode: Optional[Any] = None
    noOfBox: Optional[Any] = None
    weight: Optional[Any] = None
    status: Optional[str] = "ENQUIRY_GENERATED"
    estimatedRate: Optional[Any] = None
    finalRate: Optional[Any] = None
    currency: Optional[str] = None
    phoneNumber: Optional[str] = None

    sender: Optional[Dict[str, Any]] = None
    receiver: Optional[Dict[str, Any]] = None

    items: Optional[List[ItemSchema]] = None
    boxes: Optional[List[BoxSchema]] = None
    pickupLocations: Optional[List[PickupLocationSchema]] = None

    class Config:
        extra = "allow"

class EnquiryStatusUpdateRequest(BaseModel):
    status: str

class AddBoxItemRequest(BaseModel):
    boxId: int
    enquiryItemId: int
    quantity: int = 1
