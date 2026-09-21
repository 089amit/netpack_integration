from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from database import get_db
from models.customer import Notification

router = APIRouter(prefix="/api/notification", tags=["Notifications"])

class NotificationSendRequest(BaseModel):
    title: Optional[str] = "NetPack Notification"
    body: Optional[str] = None
    description: Optional[str] = None
    userId: Optional[int] = None
    customerId: Optional[int] = None
    scope: Optional[str] = "ALL_USERS"

class BulkNotificationRequest(BaseModel):
    title: Optional[str] = "NetPack Notification"
    body: Optional[str] = None
    description: Optional[str] = None
    customerIds: Optional[List[int]] = None
    userIds: Optional[List[int]] = None
    scope: Optional[str] = "ALL_CUSTOMERS"

@router.post("/sendNotification")
def send_notification(payload: NotificationSendRequest, db: Session = Depends(get_db)):
    n = Notification(
        title=payload.title or "NetPack Notification",
        body=payload.body or payload.description or "",
        userId=payload.userId,
        customerId=payload.customerId,
        scope=payload.scope or "ALL_CUSTOMERS",
        isRead=False
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"message": "Notification sent successfully", "id": n.id}

@router.post("/send-bulk-notification")
def send_bulk_notification(payload: BulkNotificationRequest, db: Session = Depends(get_db)):
    notif_title = payload.title or "NetPack Notification"
    notif_body = payload.body or payload.description or ""
    target_ids = payload.customerIds or payload.userIds or []

    if target_ids:
        for cid in target_ids:
            n = Notification(
                title=notif_title,
                body=notif_body,
                customerId=cid,
                scope="SPECIFIC_CUSTOMER",
                isRead=False
            )
            db.add(n)
    else:
        n = Notification(
            title=notif_title,
            body=notif_body,
            scope=payload.scope or "ALL_CUSTOMERS",
            isRead=False
        )
        db.add(n)
    db.commit()
    return {"message": "Bulk notifications dispatched successfully"}

@router.get("/getNotifications")
def get_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.createdAt.desc()).limit(50).all()

@router.get("/unreadCount")
def get_unread_count(db: Session = Depends(get_db)):
    cnt = db.query(Notification).filter(Notification.isRead == False).count()
    return {"count": cnt}

@router.get("/markAllAsRead")
def mark_all_as_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.isRead == False).update({"isRead": True})
    db.commit()
    return {"message": "All notifications marked as read"}
