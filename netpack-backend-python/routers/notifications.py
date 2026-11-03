from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from database import get_db
from models.customer import Notification, FcmToken
from services.auth_service import get_requester_identity

router = APIRouter(prefix="/api/notification", tags=["Notifications"])

class NotificationSendRequest(BaseModel):
    title: Optional[str] = "NetPack Logistic Notification"
    body: Optional[str] = None
    description: Optional[str] = None
    userId: Optional[int] = None
    customerId: Optional[int] = None
    scope: Optional[str] = "ALL_USERS"

class BulkNotificationRequest(BaseModel):
    title: Optional[str] = "NetPack Logistic Notification"
    body: Optional[str] = None
    description: Optional[str] = None
    customerIds: Optional[List[int]] = None
    userIds: Optional[List[int]] = None
    scope: Optional[str] = "ALL_CUSTOMERS"

class FcmTokenRegisterRequest(BaseModel):
    token: str
    customerId: Optional[int] = None

@router.post("/sendNotification")
def send_notification(payload: NotificationSendRequest, db: Session = Depends(get_db)):
    n = Notification(
        title=payload.title or "NetPack Logistic Notification",
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
    notif_title = payload.title or "NetPack Logistic Notification"
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
        db.commit()
        return {"message": f"Notifications dispatched to {len(target_ids)} selected recipients"}
    elif payload.scope in ("ALL_CUSTOMERS", "ALL_USERS"):
        n = Notification(
            title=notif_title,
            body=notif_body,
            scope=payload.scope,
            isRead=False
        )
        db.add(n)
        db.commit()
        return {"message": "Broadcast notification dispatched successfully"}

    return {"message": "No recipient selected for notification"}

@router.post("/register-token")
def register_device_token(
    payload: FcmTokenRegisterRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Registers or updates a device push / FCM token for customer notification delivery."""
    requester = get_requester_identity(authorization, db)
    cust_id = payload.customerId or requester.customer_id
    if not cust_id:
        return {"success": False, "message": "Customer identification required to bind push token"}

    existing = db.query(FcmToken).filter(FcmToken.token == payload.token.strip()).first()
    if existing:
        existing.customerId = cust_id
    else:
        new_tok = FcmToken(token=payload.token.strip(), customerId=cust_id)
        db.add(new_tok)
    db.commit()
    return {"success": True, "message": "Push token registered successfully"}

@router.get("/getNotifications")
def get_notifications(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Returns real-time notifications for the customer app and dashboard.
    Strictly prevents notifications from leaking to unauthenticated devices.
    """
    requester = get_requester_identity(authorization, db)
    if not requester.customer_id and not requester.user_id:
        return []

    query = db.query(Notification)
    if requester.customer_id:
        query = query.filter(
            (Notification.customerId == requester.customer_id) |
            (Notification.scope == "ALL_CUSTOMERS") |
            (Notification.scope == "ALL_USERS")
        )
    elif requester.user_id:
        query = query.filter(
            (Notification.userId == requester.user_id) |
            (Notification.scope == "ALL_USERS") |
            (Notification.scope == "ALL_CUSTOMERS")
        )

    notifs = query.order_by(Notification.createdAt.desc()).limit(50).all()
    results = []
    for n in notifs:
        created_str = n.createdAt.strftime('%Y-%m-%dT%H:%M:%SZ') if n.createdAt else None
        results.append({
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "userId": n.userId,
            "customerId": n.customerId,
            "scope": n.scope,
            "isRead": bool(n.isRead),
            "createdAt": created_str,
            "updatedAt": (n.updatedAt.strftime('%Y-%m-%dT%H:%M:%SZ') if n.updatedAt else created_str)
        })
    return results

@router.get("/unreadCount")
def get_unread_count(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    requester = get_requester_identity(authorization, db)
    if not requester.customer_id and not requester.user_id:
        return {"count": 0}

    query = db.query(Notification).filter(Notification.isRead == False)
    if requester.customer_id:
        query = query.filter(
            (Notification.customerId == requester.customer_id) |
            (Notification.scope == "ALL_CUSTOMERS") |
            (Notification.scope == "ALL_USERS")
        )
    elif requester.user_id:
        query = query.filter(
            (Notification.userId == requester.user_id) |
            (Notification.scope == "ALL_USERS") |
            (Notification.scope == "ALL_CUSTOMERS")
        )

    cnt = query.count()
    return {"count": cnt}

@router.get("/markAllAsRead")
def mark_all_as_read(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    requester = get_requester_identity(authorization, db)
    query = db.query(Notification).filter(Notification.isRead == False)

    if requester.customer_id:
        query = query.filter(
            (Notification.customerId == requester.customer_id) |
            (Notification.scope == "ALL_CUSTOMERS")
        )
    elif requester.user_id:
        query = query.filter(
            (Notification.userId == requester.user_id) |
            (Notification.scope == "ALL_USERS")
        )

    query.update({"isRead": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}
