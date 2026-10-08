"""
NetPack Logistics - Automated Database Backup & Snapshot Service
Provides JSON-based snapshot export and restore across SQLite and PostgreSQL,
safeguarding data against ephemeral container redeployments.
"""

import json
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from config import DATA_DIR, BASE_DIR
from database import engine, SessionLocal, Base
from models.user import Role, User
from models.location import Zone, Country, City
from models.rate import Rate, TIACharge, CustomCharge, PackingCharge
from models.mawb import Agent, ForwardingCompany, ForwardingService
from models.customer import Customer, Notification
from models.enquiry import Enquiry, EnquiryItem, Box, PickupLocationEnquiry
from models.shipment import Shipment, TrackingEvent

BACKUP_DIR = DATA_DIR / "backups"
try:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass
LATEST_BACKUP_PATH = BACKUP_DIR / "netpack_snapshot_latest.json"

# Fallback in base dir if data dir was external
SEED_BACKUP_PATH = BASE_DIR / "netpack_seed_snapshot.json"


def serialize_datetime(val):
    if isinstance(val, datetime):
        return val.isoformat()
    return val


def create_database_backup(db: Session = None, target_file: Path = None) -> str:
    """Exports all core business tables to a clean JSON snapshot."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    out_file = target_file or LATEST_BACKUP_PATH

    try:
        data = {
            "version": "1.0",
            "exportedAt": datetime.utcnow().isoformat(),
            "users": [
                {
                    "id": u.id,
                    "email": u.email,
                    "username": u.username,
                    "password": u.password,
                    "fullName": u.fullName,
                    "phoneNumber": u.phoneNumber,
                    "roleId": u.roleId,
                    "isActive": u.isActive
                }
                for u in db.query(User).all()
            ],
            "customers": [
                {
                    "id": c.id,
                    "name": c.name,
                    "email": c.email,
                    "phone": c.phone,
                    "password": c.password,
                    "countryId": c.countryId,
                    "address1": c.address1,
                    "address2": c.address2,
                    "city": c.city,
                    "state": c.state,
                    "postcode": c.postcode,
                    "photoUrl": c.photoUrl,
                    "userId": c.userId
                }
                for c in db.query(Customer).all()
            ],
            "enquiries": [
                {
                    "id": e.id,
                    "trackingNumber": e.trackingNumber,
                    "customerId": e.customerId,
                    "senderName": e.senderName,
                    "senderPhone": e.senderPhone,
                    "senderEmail": e.senderEmail,
                    "senderAddressLine1": e.senderAddressLine1,
                    "senderCity": e.senderCity,
                    "senderCountry": e.senderCountry,
                    "receiverName": e.receiverName,
                    "receiverAddressLine1": e.receiverAddressLine1,
                    "receiverCity": e.receiverCity,
                    "receiverCountry": e.receiverCountry,
                    "receiverTelephone": e.receiverTelephone,
                    "receiverEmail": e.receiverEmail,
                    "receiverPostcode": e.receiverPostcode,
                    "weight": e.weight,
                    "volumetricWeight": e.volumetricWeight,
                    "chargeableWeight": e.chargeableWeight,
                    "noOfBox": e.noOfBox,
                    "status": e.status,
                    "trackingMode": e.trackingMode,
                    "pickupRequired": e.pickupRequired,
                    "pickedUpAt": serialize_datetime(e.pickedUpAt),
                    "weightProofImageUrl": e.weightProofImageUrl,
                    "pickupNotes": e.pickupNotes,
                    "destinationCountry": e.destinationCountry,
                    "destinationLocation": e.destinationLocation,
                    "createdAt": serialize_datetime(e.createdAt),
                    "items": [
                        {
                            "description": it.description,
                            "quantity": it.quantity,
                            "weight": it.weight,
                            "unitPrice": it.unitPrice,
                            "totalValue": it.totalValue
                        }
                        for it in e.items
                    ],
                    "boxes": [
                        {
                            "trackingNumber": b.trackingNumber,
                            "length": b.length,
                            "breadth": b.breadth,
                            "height": b.height,
                            "weight": b.weight,
                            "dimensions": b.dimensions,
                            "quantity": b.quantity,
                            "multiplier": b.multiplier
                        }
                        for b in e.boxes
                    ],
                    "pickupLocations": [
                        {
                            "location": pl.location,
                            "phoneNumber": pl.phoneNumber,
                            "note": pl.note
                        }
                        for pl in e.pickupLocations
                    ]
                }
                for e in db.query(Enquiry).all()
            ],
            "shipments": [
                {
                    "id": s.id,
                    "hawbno": s.hawbno,
                    "forwardingNumber": s.forwardingNumber,
                    "enquiryId": s.enquiryId,
                    "customerId": s.customerId,
                    "countryId": s.countryId,
                    "status": s.status,
                    "trackingMode": s.trackingMode,
                    "agent": s.agent,
                    "forwardingCompanyId": s.forwardingCompanyId,
                    "createdAt": serialize_datetime(s.createdAt)
                }
                for s in db.query(Shipment).all()
            ],
            "trackingEvents": [
                {
                    "trackingNumber": te.trackingNumber,
                    "shipmentId": te.shipmentId,
                    "status": te.status,
                    "location": te.location,
                    "activity": te.activity,
                    "country": te.country,
                    "source": te.source,
                    "checkpointTime": serialize_datetime(te.checkpointTime)
                }
                for te in db.query(TrackingEvent).all()
            ]
        }

        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        # Also maintain seed backup in BASE_DIR so it ships with git
        if out_file != SEED_BACKUP_PATH:
            try:
                with open(SEED_BACKUP_PATH, "w", encoding="utf-8") as f2:
                    json.dump(data, f2, indent=2)
            except Exception:
                pass

        print(f"[Backup] Successfully exported database snapshot to {out_file}")
        return str(out_file)
    finally:
        if close_db:
            db.close()


def restore_database_backup_if_empty(db: Session = None) -> bool:
    """Restores database from snapshot if customer / enquiry records are empty."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Check if customer or enquiry data already exists
        enquiry_count = db.query(Enquiry).count()
        customer_count = db.query(Customer).count()
        if enquiry_count > 0 or customer_count > 1:
            return False  # Already populated

        # Find available backup file
        target_file = None
        if LATEST_BACKUP_PATH.exists():
            target_file = LATEST_BACKUP_PATH
        elif SEED_BACKUP_PATH.exists():
            target_file = SEED_BACKUP_PATH

        if not target_file:
            return False

        with open(target_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        print(f"[*] Auto-restoring permanent database snapshot from {target_file.name}...")

        # 1. Restore Customers
        for c_data in data.get("customers", []):
            existing = db.query(Customer).filter(Customer.email == c_data["email"]).first()
            if not existing:
                c = Customer(
                    name=c_data.get("name"),
                    email=c_data.get("email"),
                    phone=c_data.get("phone"),
                    password=c_data.get("password"),
                    countryId=c_data.get("countryId", 1),
                    address1=c_data.get("address1"),
                    address2=c_data.get("address2"),
                    city=c_data.get("city", "Kathmandu"),
                    state=c_data.get("state"),
                    postcode=c_data.get("postcode"),
                    photoUrl=c_data.get("photoUrl"),
                    userId=c_data.get("userId")
                )
                db.add(c)
        db.commit()

        # Build customer map
        cust_map = {c.email: c.id for c in db.query(Customer).all()}

        # 2. Restore Enquiries, Items, Boxes
        for e_data in data.get("enquiries", []):
            existing_enq = db.query(Enquiry).filter(Enquiry.trackingNumber == e_data["trackingNumber"]).first()
            if existing_enq:
                continue

            c_email = e_data.get("senderEmail")
            cid = cust_map.get(c_email) if c_email else 1

            enq = Enquiry(
                trackingNumber=e_data.get("trackingNumber"),
                customerId=cid,
                senderName=e_data.get("senderName"),
                senderPhone=e_data.get("senderPhone"),
                senderEmail=e_data.get("senderEmail"),
                senderAddressLine1=e_data.get("senderAddressLine1"),
                senderCity=e_data.get("senderCity"),
                senderCountry=e_data.get("senderCountry", "Nepal"),
                receiverName=e_data.get("receiverName"),
                receiverAddressLine1=e_data.get("receiverAddressLine1"),
                receiverCity=e_data.get("receiverCity"),
                receiverCountry=e_data.get("receiverCountry"),
                receiverTelephone=e_data.get("receiverTelephone"),
                receiverEmail=e_data.get("receiverEmail"),
                receiverPostcode=e_data.get("receiverPostcode"),
                weight=e_data.get("weight"),
                volumetricWeight=e_data.get("volumetricWeight"),
                chargeableWeight=e_data.get("chargeableWeight"),
                noOfBox=e_data.get("noOfBox", 1),
                status=e_data.get("status", "ENQUIRY_GENERATED"),
                trackingMode=e_data.get("trackingMode", "MANUAL"),
                pickupRequired=e_data.get("pickupRequired", True),
                pickedUpAt=datetime.fromisoformat(e_data["pickedUpAt"]) if e_data.get("pickedUpAt") else None,
                weightProofImageUrl=e_data.get("weightProofImageUrl"),
                pickupNotes=e_data.get("pickupNotes"),
                destinationCountry=e_data.get("destinationCountry", 1),
                destinationLocation=e_data.get("destinationLocation"),
                createdAt=datetime.fromisoformat(e_data["createdAt"]) if e_data.get("createdAt") else datetime.utcnow()
            )
            db.add(enq)
            db.commit()
            db.refresh(enq)

            # Items
            for it in e_data.get("items", []):
                db.add(EnquiryItem(
                    enquiryId=enq.id,
                    description=it.get("description"),
                    quantity=it.get("quantity", 1),
                    weight=it.get("weight", enq.weight),
                    unitPrice=it.get("unitPrice", 0.0),
                    totalValue=it.get("totalValue", 0.0)
                ))

            # Boxes
            for bx in e_data.get("boxes", []):
                db.add(Box(
                    enquiryId=enq.id,
                    trackingNumber=bx.get("trackingNumber") or f"{enq.trackingNumber}-B1",
                    length=bx.get("length", 30.0),
                    breadth=bx.get("breadth", 20.0),
                    height=bx.get("height", 20.0),
                    weight=bx.get("weight", enq.weight),
                    dimensions=bx.get("dimensions", "Standard Box"),
                    quantity=bx.get("quantity", 1),
                    multiplier=bx.get("multiplier", 1.0)
                ))

            # Pickup locations
            for pl in e_data.get("pickupLocations", []):
                db.add(PickupLocationEnquiry(
                    enquiryId=enq.id,
                    location=pl.get("location"),
                    phoneNumber=pl.get("phoneNumber"),
                    note=pl.get("note")
                ))

            db.commit()

        # 3. Restore Shipments
        for s_data in data.get("shipments", []):
            existing_s = db.query(Shipment).filter(Shipment.hawbno == s_data.get("hawbno")).first() if s_data.get("hawbno") else None
            if existing_s:
                continue

            enq_id = s_data.get("enquiryId")
            sh = Shipment(
                hawbno=s_data.get("hawbno"),
                forwardingNumber=s_data.get("forwardingNumber"),
                enquiryId=enq_id,
                customerId=s_data.get("customerId", 1),
                countryId=s_data.get("countryId", 1),
                status=s_data.get("status", "SHIPMENT_CREATED"),
                trackingMode=s_data.get("trackingMode", "MANUAL"),
                agent=s_data.get("agent"),
                forwardingCompanyId=s_data.get("forwardingCompanyId")
            )
            db.add(sh)
        db.commit()

        # 4. Restore Tracking Events
        for te_data in data.get("trackingEvents", []):
            db.add(TrackingEvent(
                trackingNumber=te_data.get("trackingNumber"),
                shipmentId=te_data.get("shipmentId"),
                status=te_data.get("status"),
                location=te_data.get("location"),
                activity=te_data.get("activity"),
                country=te_data.get("country", ""),
                source=te_data.get("source", "INTERNAL"),
                checkpointTime=datetime.fromisoformat(te_data["checkpointTime"]) if te_data.get("checkpointTime") else datetime.utcnow()
            ))
        db.commit()

        print("[OK] Permanent database snapshot restored successfully!")
        return True
    except Exception as err:
        print(f"[Backup Warning] Auto-restore from snapshot failed: {err}")
        db.rollback()
        return False
    finally:
        if close_db:
            db.close()
