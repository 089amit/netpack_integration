from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base

class EmailMessage(Base):
    __tablename__ = "email_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(255), nullable=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    htmlContent = Column(Text, nullable=True)
    textContent = Column(Text, nullable=True)
    status = Column(String(50), default="SENT")  # SENT, SIMULATED, FAILED, RECEIVED
    provider = Column(String(50), nullable=True)  # SMTP, Resend, Brevo, Simulated
    direction = Column(String(20), default="OUTBOUND")  # OUTBOUND, INBOUND
    errorMessage = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
