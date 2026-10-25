from sqlalchemy import Column, Integer, String, LargeBinary, DateTime
from datetime import datetime
from database import Base

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    file_path = Column(String(255), unique=True, index=True, nullable=False)
    content = Column(LargeBinary, nullable=False)
    mime_type = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
