from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    password = Column(String(255), nullable=True)
    email = Column(String(150), unique=True, nullable=True, index=True)
    gender = Column(String(20), nullable=True)  # MALE, FEMALE, OTHER
    isOrganization = Column(Boolean, default=False)
    organizationName = Column(String(150), nullable=True)
    firebaseUid = Column(String(150), unique=True, nullable=True, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    address1 = Column(String(255), nullable=True)
    address2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    countryId = Column(Integer, ForeignKey("countries.id"), nullable=False)
    postcode = Column(String(50), nullable=True)
    photoUrl = Column(String(500), nullable=True)
    createdBy = Column(Integer, ForeignKey("users.id"), nullable=True)
    userId = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)

    country = relationship("Country", back_populates="customers")
    creator = relationship("User", back_populates="createdCustomers", foreign_keys=[createdBy])
    linkedUser = relationship("User", back_populates="customerAccess", foreign_keys=[userId])
    enquiries = relationship("Enquiry", back_populates="customer")
    shipments = relationship("Shipment", back_populates="customer")
    fcmTokens = relationship("FcmToken", back_populates="customer")
    notifications = relationship("Notification", back_populates="customer")


class FcmToken(Base):
    __tablename__ = "fcm_tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    customerId = Column(Integer, ForeignKey("customers.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="fcmTokens")
    notifications = relationship("Notification", back_populates="fcmToken")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    body = Column(String(1000), nullable=False)
    userId = Column(Integer, ForeignKey("users.id"), nullable=True)
    customerId = Column(Integer, ForeignKey("customers.id"), nullable=True)
    fcmTokenId = Column(Integer, ForeignKey("fcm_tokens.id"), nullable=True)
    scope = Column(String(50), nullable=True)  # ALL_USERS, ALL_CUSTOMERS, SPECIFIC_USER, SPECIFIC_CUSTOMER
    isRead = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    customer = relationship("Customer", back_populates="notifications")
    fcmToken = relationship("FcmToken", back_populates="notifications")
