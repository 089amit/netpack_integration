from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), nullable=True)
    phoneNumber = Column(String(50), nullable=True)
    fullName = Column(String(150), nullable=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    isActive = Column(Boolean, default=True)
    roleId = Column(Integer, ForeignKey("roles.id"), nullable=True)
    isOrganization = Column(Boolean, default=False)
    organizationName = Column(String(150), nullable=True)
    address1 = Column(String(255), nullable=True)
    address2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postcode = Column(String(50), nullable=True)
    countryId = Column(Integer, ForeignKey("countries.id"), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    country = relationship("Country", back_populates="users", foreign_keys=[countryId])
    notifications = relationship("Notification", back_populates="user")
    createdEnquiries = relationship("Enquiry", back_populates="creator", foreign_keys="Enquiry.createdBy")
    createdCustomers = relationship("Customer", back_populates="creator", foreign_keys="Customer.createdBy")
    customerAccess = relationship("Customer", back_populates="linkedUser", uselist=False, foreign_keys="Customer.userId")
