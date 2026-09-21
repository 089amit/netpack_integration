from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import urllib.parse
from datetime import datetime
import json
import logging

from database import get_db
from models.shipment import Shipment, TrackingEvent
from models.mawb import MAWB
from models.enquiry import Enquiry
from services.tracking_service import tracking_registry
from services.trackingmore_service import trackingmore_service

logger = logging.getLogger("tracking")

router = APIRouter(prefix="/api/tracking", tags=["Tracking"])

@router.get("/trackingmore/status")
def get_trackingmore_status(request: Request, db: Session = Depends(get_db)):
    """
    Returns TrackingMore integration health, configuration status,
    and the exact Webhook URL to enter into the TrackingMore Dashboard.
    """
    base_url = str(request.base_url).rstrip("/")
    webhook_url = f"{base_url}/api/tracking/webhook/trackingmore"
    events_count = db.query(TrackingEvent).count()
    return {
        "configured": trackingmore_service.is_configured,
        "apiKeyMasked": trackingmore_service.get_masked_key(),
        "hasWebhookSecret": trackingmore_service.has_secret,
        "webhookSecretMasked": trackingmore_service.get_masked_secret(),
        "webhookUrl": webhook_url,
        "eventsCount": events_count,
        "instructions": (
            "1. Enter your TrackingMore API key and optional Webhook Secret here or in netpack-backend-python/.env.\n"
            f"2. In your TrackingMore Dashboard (Settings -> Webhook), set the Webhook URL to: {webhook_url}\n"
            "3. Select Events: 'All updates' or 'Tracking status changed'."
        ),
        "supportedCouriers": list(trackingmore_service.COURIER_MAP.keys())
    }

@router.post("/trackingmore/save-key")
def save_trackingmore_key(payload: Dict[str, Any] = Body(...)):
    """
    Saves TrackingMore API key and/or webhook secret in-memory and persists to .env.
    """
    api_key = payload.get("apiKey") or payload.get("api_key")
    webhook_secret = payload.get("webhookSecret") or payload.get("webhook_secret")

    if api_key is None and webhook_secret is None:
        raise HTTPException(status_code=400, detail="apiKey or webhookSecret is required")

    # If one of the values is not provided in payload, retain the current value
    target_key = api_key.strip() if (api_key is not None and api_key.strip()) else trackingmore_service.api_key
    target_secret = webhook_secret.strip() if (webhook_secret is not None and webhook_secret.strip()) else trackingmore_service.webhook_secret

    success = trackingmore_service.update_credentials(api_key=target_key, webhook_secret=target_secret)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to persist credentials to .env file")

    return {
        "success": True,
        "configured": trackingmore_service.is_configured,
        "apiKeyMasked": trackingmore_service.get_masked_key(),
        "hasWebhookSecret": trackingmore_service.has_secret,
        "webhookSecretMasked": trackingmore_service.get_masked_secret(),
        "message": "TrackingMore API credentials saved and persisted successfully"
    }

@router.post("/trackingmore/test-webhook")
def test_trackingmore_webhook(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Simulates a live TrackingMore webhook trigger for testing prior to production deployment.
    Ingests realistic carrier tracking event data and synchronizes shipment and enquiry status.
    """
    shipment_id = payload.get("shipmentId")
    shipment = None
    if shipment_id:
        shipment = db.query(Shipment).filter(Shipment.id == int(shipment_id)).first()
    if not shipment:
        # Pick the latest shipment
        shipment = db.query(Shipment).order_by(Shipment.id.desc()).first()

    if not shipment:
        raise HTTPException(status_code=404, detail="No shipments found in database to test webhook with")

    target_status = (payload.get("status") or "OUT_FOR_DELIVERY").upper()
    location = payload.get("location") or "Regional Distribution Hub, UK"
    activity = payload.get("activity") or "Package scanned - Out for delivery with local courier driver"
    courier_code = payload.get("courierCode") or (shipment.forwardingCompany.name if shipment.forwardingCompany else "dpd")
    tracking_no = shipment.forwardingNumber or shipment.hawbno or f"TEST-{shipment.id}"

    prev_status = shipment.status
    mapped_status = trackingmore_service.map_status(target_status)
    shipment.status = mapped_status
    if shipment.enquiry:
        shipment.enquiry.status = mapped_status

    now = datetime.utcnow()
    new_event = TrackingEvent(
        shipmentId=shipment.id,
        trackingNumber=tracking_no,
        courierCode=courier_code.lower(),
        status=mapped_status,
        location=location,
        activity=activity,
        country="Destination",
        checkpointTime=now,
        rawJson=json.dumps({"test_webhook": True, "status": target_status, "activity": activity}),
        source=f"TRACKINGMORE:{courier_code.upper()}"
    )
    db.add(new_event)
    db.commit()
    db.refresh(shipment)

    return {
        "success": True,
        "message": f"Test webhook successfully processed for shipment #{shipment.id} ({shipment.hawbno or tracking_no})",
        "shipmentId": shipment.id,
        "hawbno": shipment.hawbno,
        "trackingNumber": tracking_no,
        "courierCode": courier_code,
        "previousStatus": prev_status,
        "newStatus": shipment.status,
        "enquiryStatus": shipment.enquiry.status if shipment.enquiry else None,
        "checkpoint": {
            "location": location,
            "activity": activity,
            "status": mapped_status,
            "timestamp": now.isoformat(),
            "source": f"TRACKINGMORE:{courier_code.upper()}"
        }
    }

@router.post("/trackingmore/register")
def register_tracking_with_trackingmore(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Manually or programmatically register a tracking number (courier or air cargo) with TrackingMore.
    """
    tracking_number = payload.get("trackingNumber") or payload.get("tracking_number")
    courier_code = payload.get("courierCode") or payload.get("courier_code")
    customer_name = payload.get("customerName")

    if not tracking_number:
        raise HTTPException(status_code=400, detail="trackingNumber is required")

    result = trackingmore_service.create_tracking(
        tracking_number=tracking_number,
        courier_code=courier_code,
        customer_name=customer_name
    )
    return result

@router.post("/webhook/trackingmore")
async def trackingmore_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Dedicated TrackingMore Webhook Receiver:
    TrackingMore pushes real-time tracking updates, checkpoints, and status changes here.
    Docs: https://www.trackingmore.com/v4/api-index.html#webhooks
    """
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    data = payload.get("data", {})
    if not data and isinstance(payload, dict):
        # In some webhooks, data is at top level
        data = payload

    tracking_no = data.get("tracking_number") or data.get("trackingNumber")
    courier_code = data.get("courier_code") or data.get("carrier_code") or ""
    delivery_status = data.get("delivery_status") or data.get("status")

    if not tracking_no:
        return {"code": 200, "message": "Acknowledged: empty tracking number"}

    clean_track = tracking_no.strip()

    # 1. Match Shipment by forwardingNumber or hawbno
    shipment = (
        db.query(Shipment).filter(Shipment.forwardingNumber == clean_track).first() or
        db.query(Shipment).filter(Shipment.hawbno == clean_track).first()
    )

    # 2. Match MAWB if tracking_no is a Master Air Waybill
    if not shipment:
        mawb = db.query(MAWB).filter(MAWB.mawbNumber == clean_track).first()
        if mawb and mawb.shipments:
            shipment = mawb.shipments[0]

    # 3. Match Enquiry by trackingNumber
    if not shipment:
        enq = db.query(Enquiry).filter(Enquiry.trackingNumber == clean_track).first()
        if enq and enq.shipments:
            shipment = enq.shipments[0]

    if shipment:
        # Update shipment status
        if delivery_status:
            mapped_status = trackingmore_service.map_status(delivery_status, courier_code=courier_code)
            shipment.status = mapped_status
            if shipment.enquiry:
                shipment.enquiry.status = mapped_status

        # Parse & persist checkpoints
        checkpoints = trackingmore_service.extract_checkpoints_from_data(data)
        if checkpoints:
            latest_cp = checkpoints[-1]
            if latest_cp.get("status") in ("ARRIVED_AT_HUB", "CARRIER_SCANNED", "OUT_FOR_DELIVERY", "DELIVERED"):
                mapped_status = latest_cp["status"]
                shipment.status = mapped_status
                if shipment.enquiry:
                    shipment.enquiry.status = mapped_status

        existing_signatures = {
            f"{te.location}_{te.activity}"
            for te in shipment.trackingEvents
        }

        for cp in checkpoints:
            sig = f"{cp.get('location')}_{cp.get('activity')}"
            if sig not in existing_signatures:
                existing_signatures.add(sig)
                dt_val = None
                if cp.get("timestamp"):
                    try:
                        dt_val = datetime.fromisoformat(cp["timestamp"])
                    except Exception:
                        dt_val = datetime.utcnow()

                te = TrackingEvent(
                    shipmentId=shipment.id,
                    trackingNumber=clean_track,
                    courierCode=courier_code,
                    status=cp.get("status") or "CARRIER_SCANNED",
                    location=cp.get("location") or "Carrier Facility",
                    activity=cp.get("activity") or "Carrier Scan",
                    country=cp.get("country") or "",
                    checkpointTime=dt_val or datetime.utcnow(),
                    rawJson=json.dumps(cp)[:3900],
                    source=f"TRACKINGMORE:{courier_code.upper()}" if courier_code else "TRACKINGMORE"
                )
                db.add(te)

        try:
            db.commit()
            logger.info(f"TrackingMore webhook updated shipment {shipment.id} ({clean_track}) to {shipment.status}")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed committing TrackingMore webhook updates: {e}")

    return {"code": 200, "message": "Success"}

@router.get("/providers")
def get_tracking_providers():
    """
    Returns list of integrated carrier & airline tracking providers,
    their codes, and whether live production API credentials are configured.
    """
    providers_info = []
    for code, prov in tracking_registry.providers.items():
        providers_info.append({
            "key": code,
            "name": prov.name,
            "code": prov.code,
            "isLiveConfigured": prov.is_live_configured
        })
    return {
        "providers": providers_info,
        "trackingMoreConfigured": trackingmore_service.is_configured,
        "instructions": "Set TRACKINGMORE_API_KEY in .env to enable unified real-time multi-carrier and airline tracking."
    }

@router.get("/{trackingNumber}")
def track_shipment_or_cargo(trackingNumber: str, db: Session = Depends(get_db)):
    """
    Unified Tracking Endpoint:
    Tracks cargo by Enquiry Tracking Number, HAWB, Forwarding Number, or MAWB.
    Returns general details, air freight leg, overseas courier leg, and chronological checkpoints.
    """
    decoded = urllib.parse.unquote(trackingNumber).strip()
    result = tracking_registry.track_cargo(db, decoded)
    if not result.get("found"):
        raise HTTPException(status_code=404, detail=result.get("message", "Tracking not found"))
    return result

@router.post("/sync/{identifier}")
def sync_shipment_tracking(identifier: str, db: Session = Depends(get_db)):
    """
    Forces an immediate live sync with TrackingMore for a specific shipment,
    HAWB number, forwarding number, or enquiry tracking number.
    Registers the tracking number if needed, fetches live checkpoints, and persists them to DB.
    """
    clean_id = urllib.parse.unquote(identifier).strip()

    shipment = None
    # 1. Try numeric shipment ID
    try:
        num_id = int(clean_id)
        shipment = db.query(Shipment).filter(Shipment.id == num_id).first()
    except ValueError:
        pass

    # 2. Try HAWB number or forwarding number
    if not shipment:
        shipment = (
            db.query(Shipment).filter(Shipment.hawbno == clean_id).first() or
            db.query(Shipment).filter(Shipment.forwardingNumber == clean_id).first()
        )

    # 3. Try Enquiry tracking number or ID
    if not shipment:
        enq = None
        try:
            enq = db.query(Enquiry).filter(Enquiry.id == int(clean_id)).first()
        except ValueError:
            pass
        if not enq:
            enq = db.query(Enquiry).filter(Enquiry.trackingNumber == clean_id).first()
        if enq and enq.shipments:
            shipment = enq.shipments[0]

    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment not found for identifier '{clean_id}'")

    sync_result = tracking_registry.sync_tracking_live(db, shipment)
    track_id = shipment.forwardingNumber or shipment.hawbno or str(shipment.id)
    refreshed_cargo = tracking_registry.track_cargo(db, track_id)

    return {
        "message": "Tracking synchronized successfully",
        "shipmentId": shipment.id,
        "syncResult": sync_result,
        "tracking": refreshed_cargo
    }

@router.post("/webhook/{carrier}")
def carrier_tracking_webhook(carrier: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Extensible Generic Webhook Receiver for direct carrier feeds.
    """
    tracking_no = payload.get("trackingNumber") or payload.get("tracking_number") or payload.get("awb")
    status = payload.get("status") or "IN_TRANSIT"
    location = payload.get("location") or "Carrier Facility"

    if tracking_no:
        shipment = db.query(Shipment).filter(Shipment.forwardingNumber == tracking_no).first()
        if shipment:
            if status.upper() in ["DELIVERED", "OUT_FOR_DELIVERY", "CARRIER_SCANNED", "IN_TRANSIT", "CUSTOMS_HOLD", "PICKED_UP", "ARRIVED_AT_HUB"]:
                shipment.status = status.upper()
                if shipment.enquiry:
                    shipment.enquiry.status = status.upper()
                db.commit()
            return {"status": "success", "message": f"Updated shipment {shipment.id} status to {shipment.status}"}

    return {"status": "acknowledged", "carrier": carrier, "payloadReceived": True}

