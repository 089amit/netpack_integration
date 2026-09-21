from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    status = Column(String(50), default="PENDING")
    enquiryId = Column(Integer, ForeignKey("enquiries.id"), nullable=False)
    mawbId = Column(Integer, ForeignKey("mawbs.id"), nullable=True)
    forwardingCompanyId = Column(Integer, ForeignKey("forwarding_companies.id"), nullable=True)
    serviceId = Column(Integer, ForeignKey("forwarding_services.id"), nullable=True)
    countryId = Column(Integer, ForeignKey("countries.id"), nullable=True)
    customerId = Column(Integer, ForeignKey("customers.id"), nullable=False)

    agent = Column(String(100), nullable=True)
    forwardingNumber = Column(String(100), nullable=True)
    agentShipmentNumber = Column(Integer, nullable=True)
    hawbno = Column(String(100), nullable=True, index=True)
    note = Column(String(1000), nullable=True)
    trackingMode = Column(String(20), default="MANUAL")  # MANUAL or API

    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    enquiry = relationship("Enquiry", back_populates="shipments")
    mawb = relationship("MAWB", back_populates="shipments")
    forwardingCompany = relationship("ForwardingCompany", back_populates="shipments")
    service = relationship("ForwardingService", back_populates="shipments")
    country = relationship("Country", back_populates="shipments")
    customer = relationship("Customer", back_populates="shipments")

    boxes = relationship("Box", back_populates="shipment", foreign_keys="Box.shipmentId")
    pickupLocations = relationship("ShipmentPickUpLocation", back_populates="shipment", cascade="all, delete-orphan")
    transitPoints = relationship("TransitPoint", back_populates="shipment", cascade="all, delete-orphan")
    trackingEvents = relationship("TrackingEvent", back_populates="shipment", cascade="all, delete-orphan")


class ShipmentPickUpLocation(Base):
    __tablename__ = "shipment_pickup_locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shipmentId = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    location = Column(String(255), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    shipment = relationship("Shipment", back_populates="pickupLocations")


class TransitPoint(Base):
    __tablename__ = "transit_points"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shipmentId = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    location = Column(String(255), nullable=False)
    countryId = Column(Integer, ForeignKey("countries.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    shipment = relationship("Shipment", back_populates="transitPoints")
    country = relationship("Country", back_populates="transitPoints")


class TrackingEvent(Base):
    """
    Stores individual checkpoint events received from TrackingMore API,
    webhooks, or direct courier/airline scanning.
    """
    __tablename__ = "tracking_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shipmentId = Column(Integer, ForeignKey("shipments.id"), nullable=True, index=True)
    trackingNumber = Column(String(100), nullable=False, index=True)
    courierCode = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="IN_TRANSIT")
    location = Column(String(255), nullable=True)
    activity = Column(String(500), nullable=True)
    checkpointTime = Column(DateTime, nullable=True)
    country = Column(String(100), nullable=True)
    rawJson = Column(String(4000), nullable=True)
    source = Column(String(50), default="TRACKINGMORE")
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    shipment = relationship("Shipment", back_populates="trackingEvents")

