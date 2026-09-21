from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Rate(Base):
    __tablename__ = "rates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    weightFrom = Column(Float, nullable=False)
    weightTo = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    isPerKg = Column(Boolean, nullable=False, default=False)
    zoneId = Column(Integer, ForeignKey("zones.id"), nullable=True)
    countryId = Column(Integer, ForeignKey("countries.id"), nullable=True)
    serviceId = Column(Integer, ForeignKey("forwarding_services.id"), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    country = relationship("Country", back_populates="rates")
    service = relationship("ForwardingService", back_populates="rates")
    zone = relationship("Zone", back_populates="rates")


class TIACharge(Base):
    __tablename__ = "tia_charges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rate = Column(Float, nullable=True)


class CustomCharge(Base):
    __tablename__ = "custom_charges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rate = Column(Float, nullable=True)


class PackingCharge(Base):
    __tablename__ = "packing_charges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rate = Column(Float, nullable=True)
