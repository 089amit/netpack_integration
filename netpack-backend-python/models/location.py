from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    weightLimit = Column(Float, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    countries = relationship("Country", back_populates="zone")
    rates = relationship("Rate", back_populates="zone")


class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    isActive = Column(Boolean, default=True)
    boxWeightLimit = Column(Float, nullable=True)
    zoneId = Column(Integer, ForeignKey("zones.id"), nullable=True)

    zone = relationship("Zone", back_populates="countries")
    cities = relationship("City", back_populates="country")
    users = relationship("User", back_populates="country", foreign_keys="User.countryId")
    customers = relationship("Customer", back_populates="country")
    enquiries = relationship("Enquiry", back_populates="country")
    shipments = relationship("Shipment", back_populates="country")
    rates = relationship("Rate", back_populates="country")
    transitPoints = relationship("TransitPoint", back_populates="country")
    areaSurcharges = relationship("AreaSurcharge", back_populates="country")


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    countryId = Column(Integer, ForeignKey("countries.id"), nullable=False)

    country = relationship("Country", back_populates="cities")


class AreaSurcharge(Base):
    __tablename__ = "area_surcharges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    countryId = Column(Integer, ForeignKey("countries.id"), nullable=False)
    countryCode = Column(String(10), nullable=False, index=True)
    postalCodeFrom = Column(String(50), nullable=True, index=True)
    postalCodeTo = Column(String(50), nullable=True, index=True)
    locationName = Column(String(150), nullable=True, index=True)
    surchargeType = Column(String(50), nullable=False)  # EXTENDED_AREA, REMOTE_AREA, PICKUP_AREA
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    country = relationship("Country", back_populates="areaSurcharges")
