from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trackingNumber = Column(String(100), unique=True, nullable=True, index=True)
    customerId = Column(Integer, ForeignKey("customers.id"), nullable=True)
    destinationLocation = Column(String(255), nullable=True)
    pinCode = Column(Integer, nullable=True)
    destinationCountry = Column(Integer, ForeignKey("countries.id"), nullable=False)
    noOfBox = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    status = Column(String(50), default="ENQUIRY_GENERATED")
    estimatedRate = Column(Float, nullable=True)
    finalRate = Column(Float, nullable=True)
    currency = Column(String(20), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    senderName = Column(String(150), nullable=True)
    senderAddressLine1 = Column(String(255), nullable=True)
    senderAddressLine2 = Column(String(255), nullable=True)
    senderPostcodeCity = Column(String(100), nullable=True)
    senderLocation = Column(String(100), nullable=True)
    senderCountry = Column(String(100), nullable=True)
    senderPhone = Column(String(50), nullable=True)
    senderEmail = Column(String(150), nullable=True)
    senderCity = Column(String(100), nullable=True)
    senderPostcode = Column(String(50), nullable=True)

    receiverName = Column(String(150), nullable=True)
    receiverAddressLine1 = Column(String(255), nullable=True)
    receiverAddressLine2 = Column(String(255), nullable=True)
    receiverPostcodeCity = Column(String(100), nullable=True)
    receiverLocation = Column(String(100), nullable=True)
    receiverCountry = Column(String(100), nullable=True)
    receivercompanyName = Column(String(150), nullable=True)
    receiverTelephone = Column(String(50), nullable=True)
    receiverEmail = Column(String(150), nullable=True)
    receiverState = Column(String(100), nullable=True)
    receiverCity = Column(String(100), nullable=True)
    receiverPostcode = Column(String(50), nullable=True)

    mawbId = Column(Integer, ForeignKey("mawbs.id"), nullable=True)
    createdBy = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Pickup & Warehouse Verification Details
    weightProofImageUrl = Column(String(500), nullable=True)
    pickedUpAt = Column(DateTime, nullable=True)
    pickedUpBy = Column(Integer, ForeignKey("users.id"), nullable=True)
    pickupNotes = Column(String(500), nullable=True)
    volumetricWeight = Column(Float, nullable=True)
    chargeableWeight = Column(Float, nullable=True)
    trackingMode = Column(String(20), default="MANUAL")  # MANUAL or API
    isFromCustomer = Column(Boolean, default=False)
    isPacked = Column(Boolean, default=False)
    packedAt = Column(DateTime, nullable=True)
    pickupRequired = Column(Boolean, default=True)

    customer = relationship("Customer", back_populates="enquiries")
    country = relationship("Country", back_populates="enquiries", foreign_keys=[destinationCountry])
    mawb = relationship("MAWB", back_populates="enquiry")
    creator = relationship("User", back_populates="createdEnquiries", foreign_keys=[createdBy])
    pickupStaff = relationship("User", foreign_keys=[pickedUpBy])

    items = relationship("EnquiryItem", back_populates="enquiry", cascade="all, delete-orphan")
    boxes = relationship("Box", back_populates="enquiry", foreign_keys="Box.enquiryId", cascade="all, delete-orphan")
    pickupLocations = relationship("PickupLocationEnquiry", back_populates="enquiry", cascade="all, delete-orphan")
    shipments = relationship("Shipment", back_populates="enquiry")


class EnquiryItem(Base):
    __tablename__ = "enquiry_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    description = Column(String(255), nullable=True)
    weight = Column(Float, nullable=True)
    value = Column(Float, nullable=True)
    quantity = Column(Integer, nullable=True)
    unitPrice = Column(Float, nullable=True)
    hsCode = Column(String(50), nullable=True)
    totalValue = Column(Float, nullable=True)
    enquiryId = Column(Integer, ForeignKey("enquiries.id"), nullable=False)

    enquiry = relationship("Enquiry", back_populates="items")
    boxItems = relationship("BoxItem", back_populates="enquiryItem", cascade="all, delete-orphan")


class Box(Base):
    __tablename__ = "boxes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trackingNumber = Column(String(100), nullable=True)
    weight = Column(Float, nullable=True)
    dimensions = Column(String(100), nullable=True)
    length = Column(Float, nullable=True)
    breadth = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    multiplier = Column(Float, nullable=True)
    quantity = Column(Integer, nullable=True)
    value = Column(Float, nullable=True)
    enquiryId = Column(Integer, ForeignKey("enquiries.id"), nullable=True)
    shipmentId = Column(Integer, ForeignKey("shipments.id"), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    enquiry = relationship("Enquiry", back_populates="boxes", foreign_keys=[enquiryId])
    shipment = relationship("Shipment", back_populates="boxes", foreign_keys=[shipmentId])
    items = relationship("BoxItem", back_populates="box", cascade="all, delete-orphan")


class BoxItem(Base):
    __tablename__ = "box_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quantity = Column(Integer, nullable=False, default=1)
    boxId = Column(Integer, ForeignKey("boxes.id"), nullable=False)
    enquiryItemId = Column(Integer, ForeignKey("enquiry_items.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    box = relationship("Box", back_populates="items")
    enquiryItem = relationship("EnquiryItem", back_populates="boxItems")

    __table_args__ = (
        UniqueConstraint("boxId", "enquiryItemId", name="uix_box_enquiry_item"),
    )


class PickupLocationEnquiry(Base):
    __tablename__ = "pickup_locations_enquiry"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    enquiryId = Column(Integer, ForeignKey("enquiries.id"), nullable=False)
    location = Column(String(255), nullable=False)
    phoneNumber = Column(String(50), nullable=True)
    note = Column(String(255), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    enquiry = relationship("Enquiry", back_populates="pickupLocations")
