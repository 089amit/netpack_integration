from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class WebsiteContent(Base):
    __tablename__ = "website_contents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    heroTitle = Column(String(255), default="Fast & Reliable Courier Services in Teku, Kathmandu")
    heroSubtitle = Column(Text, default="Your trusted partner for secure package delivery across Nepal and worldwide. Track your shipment in real-time.")
    heroBadge = Column(String(100), default="Teku, Kathmandu Headquarters")
    contactPhone = Column(String(50), default="015339942")
    contactEmail = Column(String(100), default="admin@netpacklogistic.com")
    contactAddress = Column(String(255), default="Teku Road, Ward No. 15, Kathmandu, Nepal")
    businessHours = Column(String(100), default="10:00 am - 5:00 pm (Sun - Fri)")
    tickerItems = Column(Text, default='["Air Cargo Route: KTM ➔ DXB (Daily Direct)", "Kathmandu Valley Pickup: Active (20-30 min dispatch)", "TIA Customs Clearance: Operational", "Coverage: 75+ Hubs Across Nepal & Worldwide"]')
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
