from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    companyName = Column(String(150), nullable=True)
    country = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postcode = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(150), unique=True, nullable=True, index=True)
    image = Column(String(255), nullable=True)
    code = Column(String(50), nullable=False, index=True)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    mawbs = relationship("MAWB", back_populates="agent")


class MAWB(Base):
    __tablename__ = "mawbs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mawbNumber = Column(String(100), unique=True, nullable=False, index=True)
    departureDate = Column(DateTime, default=datetime.utcnow)
    airlineName = Column(String(150), nullable=True)
    destination = Column(String(150), nullable=True)
    agentId = Column(Integer, ForeignKey("agents.id"), nullable=True)
    dateOfArrival = Column(DateTime, nullable=True)
    flightNumber = Column(String(50), nullable=True)
    timeOfArrival = Column(String(50), nullable=True)
    documentPath = Column(String(255), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agent = relationship("Agent", back_populates="mawbs")
    enquiry = relationship("Enquiry", back_populates="mawb")
    shipments = relationship("Shipment", back_populates="mawb")


class ForwardingCompany(Base):
    __tablename__ = "forwarding_companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    contactEmail = Column(String(150), unique=True, nullable=True)
    contactPhone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    services = relationship("ForwardingService", back_populates="forwardingCompany", cascade="all, delete-orphan")
    shipments = relationship("Shipment", back_populates="forwardingCompany")


class ForwardingService(Base):
    __tablename__ = "forwarding_services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    companyId = Column(Integer, ForeignKey("forwarding_companies.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    forwardingCompany = relationship("ForwardingCompany", back_populates="services")
    shipments = relationship("Shipment", back_populates="service")
    rates = relationship("Rate", back_populates="service")
