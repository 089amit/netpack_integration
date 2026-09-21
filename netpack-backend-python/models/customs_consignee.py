from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from database import Base

class CustomsConsignee(Base):
    __tablename__ = "customs_consignees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=True, default="")
    country = Column(String(100), nullable=True, default="UK")
    isDefault = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CustomsSetting(Base):
    __tablename__ = "customs_settings"

    key = Column(String(50), primary_key=True, index=True)
    value = Column(String(255), nullable=True)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
