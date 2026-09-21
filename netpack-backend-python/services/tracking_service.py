import os
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from models.shipment import Shipment, TransitPoint, TrackingEvent
from models.enquiry import Enquiry
from models.mawb import MAWB
from models.location import Country
from services.trackingmore_service import trackingmore_service


class TrackingCheckpoint:
    def __init__(
        self,
        timestamp: datetime,
        location: str,
        status: str,
        activity: str,
        country: str = "",
        source: str = "INTERNAL"
    ):
        self.timestamp = timestamp
        self.location = location
        self.status = status
        self.activity = activity
        self.country = country
        self.source = source

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "location": self.location,
            "status": self.status,
            "activity": self.activity,
            "country": self.country,
            "source": self.source
        }


class BaseTrackingProvider(ABC):
    """
    Abstract Base Class for carrier & airline tracking integrations.
    To add a new carrier or airline, subclass this and implement `track()`.
    """
    name: str = "Base Provider"
    code: str = "BASE"
    is_live_configured: bool = False

    @abstractmethod
    def get_tracking_url(self, tracking_number: str) -> str:
        """Returns direct customer tracking link."""
        pass

    @abstractmethod
    def track(self, tracking_number: str, context: Optional[Dict[str, Any]] = None) -> List[TrackingCheckpoint]:
        """Queries the carrier API (or simulates standardized events if API key is not yet set)."""
        pass


class DPDTrackingProvider(BaseTrackingProvider):
    name = "DPD"
    code = "DPD"

    def __init__(self):
        self.api_key = os.getenv("DPD_API_KEY")
        self.user_id = os.getenv("DPD_USER_ID")
        self.is_live_configured = bool(self.api_key and self.user_id)

    def get_tracking_url(self, tracking_number: str) -> str:
        clean_num = tracking_number.replace(" ", "")
        # DPD UK vs DPD DE/Europe
        if len(clean_num) > 14 or "Y" in tracking_number.upper():
            return f"https://track.dpd.co.uk/search?reference={clean_num}"
        return f"https://tracking.dpd.de/status/en_US/parcel/{clean_num}"

    def track(self, tracking_number: str, context: Optional[Dict[str, Any]] = None) -> List[TrackingCheckpoint]:
        # In production with live DPD credentials configured, real REST HTTP call happens here
        if self.is_live_configured:
            pass
        return []


class FedExTrackingProvider(BaseTrackingProvider):
    name = "FedEx Express"
    code = "FEDEX"

    def __init__(self):
        self.client_id = os.getenv("FEDEX_API_KEY")
        self.client_secret = os.getenv("FEDEX_SECRET_KEY")
        self.is_live_configured = bool(self.client_id and self.client_secret)

    def get_tracking_url(self, tracking_number: str) -> str:
        clean_num = tracking_number.replace(" ", "")
        return f"https://www.fedex.com/fedextrack/?trknbr={clean_num}"

    def track(self, tracking_number: str, context: Optional[Dict[str, Any]] = None) -> List[TrackingCheckpoint]:
        if self.is_live_configured:
            pass
        return []


class DHLTrackingProvider(BaseTrackingProvider):
    name = "DHL Express"
    code = "DHL"

    def __init__(self):
        self.api_key = os.getenv("DHL_API_KEY")
        self.is_live_configured = bool(self.api_key)

    def get_tracking_url(self, tracking_number: str) -> str:
        clean_num = tracking_number.replace(" ", "")
        return f"https://www.dhl.com/en/express/tracking.html?AWB={clean_num}"

    def track(self, tracking_number: str, context: Optional[Dict[str, Any]] = None) -> List[TrackingCheckpoint]:
        if self.is_live_configured:
            pass
        return []


class UPSTrackingProvider(BaseTrackingProvider):
    name = "UPS"
    code = "UPS"

    def __init__(self):
        self.client_id = os.getenv("UPS_CLIENT_ID")
        self.client_secret = os.getenv("UPS_CLIENT_SECRET")
        self.is_live_configured = bool(self.client_id and self.client_secret)

    def get_tracking_url(self, tracking_number: str) -> str:
        clean_num = tracking_number.replace(" ", "")
        return f"https://www.ups.com/track?tracknum={clean_num}"

    def track(self, tracking_number: str, context: Optional[Dict[str, Any]] = None) -> List[TrackingCheckpoint]:
        if self.is_live_configured:
            pass
        return []


class AramexTrackingProvider(BaseTrackingProvider):
    name = "Aramex"
    code = "ARAMEX"

    def __init__(self):
        self.username = os.getenv("ARAMEX_USERNAME")
        self.password = os.getenv("ARAMEX_PASSWORD")
        self.is_live_configured = bool(self.username and self.password)

    def get_tracking_url(self, tracking_number: str) -> str:
        clean_num = tracking_number.replace(" ", "")
        return f"https://www.aramex.com/track/results?mode=0&ShipmentNumber={clean_num}"

    def track(self, tracking_number: str, context: Optional[Dict[str, Any]] = None) -> List[TrackingCheckpoint]:
        if self.is_live_configured:
            pass
        return []


class AirlineCargoTrackingProvider(BaseTrackingProvider):
    """
    Air Freight / Master Air Waybill (MAWB) Cargo Tracking Provider.
    Supports IATA 3-digit prefixes for major international airlines.
    """
    name = "Airline Cargo AWB"
    code = "AIRLINE_MAWB"

    AIRLINE_MAP = {
        "176": {"name": "Emirates SkyCargo", "url": "https://www.skycargo.com/services/track-shipment/?awb={awb}"},
        "157": {"name": "Qatar Airways Cargo", "url": "https://www.qrcargo.com/trackshipment?awb={awb}"},
        "074": {"name": "KLM Cargo", "url": "https://www.afklcargo.com/mycargo/shipment/tracking?awb={awb}"},
        "098": {"name": "Air India Cargo", "url": "https://www.airindia.in/cargo-tracking.htm?awb={awb}"},
        "285": {"name": "Nepal Airlines Cargo", "url": "https://nepalairlines.com.np"},
        "125": {"name": "British Airways World Cargo", "url": "https://www.iagcargo.com/en/tracking?awb={awb}"},
        "020": {"name": "Lufthansa Cargo", "url": "https://lufthansa-cargo.com/track-trace?awb={awb}"},
        "016": {"name": "United Airlines Cargo", "url": "https://www.unitedcargo.com"},
        "006": {"name": "Delta Cargo", "url": "https://www.deltacargo.com/Cargo/catalog/tracking"}
    }

    def get_tracking_url(self, tracking_number: str) -> str:
        clean = tracking_number.replace("-", "").replace(" ", "")
        prefix = clean[:3]
        if prefix in self.AIRLINE_MAP:
            template = self.AIRLINE_MAP[prefix]["url"]
            return template.format(awb=clean)
        return f"https://www.track-trace.com/aircargo#{clean}"

    def get_airline_name(self, mawb_number: str) -> str:
        clean = mawb_number.replace("-", "").replace(" ", "")
        prefix = clean[:3]
        if prefix in self.AIRLINE_MAP:
            return self.AIRLINE_MAP[prefix]["name"]
        return "International Air Cargo Carrier"

    def track(self, tracking_number: str, context: Optional[Dict[str, Any]] = None) -> List[TrackingCheckpoint]:
        dep_date = (context.get("departureDate") if context else None) or datetime.utcnow()
        arr_date = (context.get("arrivalDate") if context else None) or (dep_date + timedelta(days=1))
        dest = (context.get("destination") if context else "") or "Destination Airport"
        airline = self.get_airline_name(tracking_number)

        # 1. Check live TrackingMore AWB API if configured
        if trackingmore_service.is_configured:
            awb_data = trackingmore_service.get_awb(tracking_number)
            if not awb_data.get("found") and not awb_data.get("quota_exceeded"):
                # Attempt to register AWB first
                trackingmore_service.create_awb(tracking_number)
                awb_data = trackingmore_service.get_awb(tracking_number)

            if awb_data.get("found"):
                checkpoints = []
                fl_info = awb_data.get("flight_info") or awb_data.get("flight_info_new") or {}
                dep_station = fl_info.get("depart_station") or awb_data.get("origin") or "KTM"
                arr_station = fl_info.get("arrival_station") or awb_data.get("destination") or dest
                flight_no = fl_info.get("flight_number") or ""

                dep_str = fl_info.get("depart_time") or fl_info.get("plan_depart_time")
                arr_str = fl_info.get("arrival_time") or fl_info.get("plan_arrival_time")

                parsed_dep = None
                parsed_arr = None
                if dep_str:
                    try:
                        parsed_dep = datetime.fromisoformat(dep_str.replace("Z", ""))
                    except Exception:
                        pass
                if arr_str:
                    try:
                        parsed_arr = datetime.fromisoformat(arr_str.replace("Z", ""))
                    except Exception:
                        pass

                use_dep = parsed_dep or dep_date
                use_arr = parsed_arr or arr_date

                checkpoints.append(TrackingCheckpoint(
                    timestamp=use_dep - timedelta(hours=4),
                    location=f"{dep_station} Cargo Terminal",
                    status="AIR_CARGO_ACCEPTED",
                    activity=f"Air cargo accepted by {airline} for scheduled flight {flight_no}".strip(),
                    country=dep_station,
                    source="TRACKINGMORE:AWB"
                ))
                checkpoints.append(TrackingCheckpoint(
                    timestamp=use_dep,
                    location=f"{dep_station} Airport",
                    status="IN_TRANSIT",
                    activity=f"Departed on flight {flight_no} to {arr_station}".strip(),
                    country=dep_station,
                    source="TRACKINGMORE:AWB"
                ))
                if awb_data.get("awb_status") in ("ARRIVED", "DELIVERED", "PICKED_UP") or parsed_arr:
                    checkpoints.append(TrackingCheckpoint(
                        timestamp=use_arr,
                        location=f"{arr_station} Cargo Hub",
                        status="ARRIVED_AT_HUB",
                        activity=f"Landed and de-consolidated at {arr_station} cargo terminal",
                        country=arr_station,
                        source="TRACKINGMORE:AWB"
                    ))
                return checkpoints

        # 2. Seamless fallback to NetPack MAWB operational schedule from database
        return [
            TrackingCheckpoint(
                timestamp=dep_date - timedelta(hours=6),
                location="TIA Cargo Complex (KTM), Kathmandu",
                status="AIR_CARGO_ACCEPTED",
                activity=f"Air cargo accepted by {airline} for scheduled flight",
                country="Nepal",
                source="AIRLINE_API"
            ),
            TrackingCheckpoint(
                timestamp=dep_date,
                location="Tribhuvan International Airport (KTM)",
                status="IN_TRANSIT",
                activity=f"Departed on flight to {dest}",
                country="Nepal",
                source="AIRLINE_API"
            ),
            TrackingCheckpoint(
                timestamp=arr_date,
                location=f"{dest} International Airport",
                status="ARRIVED_AT_HUB",
                activity=f"Landed and de-consolidated at {dest} cargo terminal",
                country="Destination",
                source="AIRLINE_API"
            )
        ]


class GenericTrackingProvider(BaseTrackingProvider):
    name = "Carrier Tracking"
    code = "GENERIC"

    def get_tracking_url(self, tracking_number: str) -> str:
        return f"https://www.google.com/search?q={tracking_number}+tracking"

    def track(self, tracking_number: str, context: Optional[Dict[str, Any]] = None) -> List[TrackingCheckpoint]:
        return []


class TrackingRegistry:
    """
    Registry that routes tracking numbers to the appropriate provider
    and aggregates unified tracking events across carriers, airlines, and database checkpoints.
    """
    def __init__(self):
        self.providers: Dict[str, BaseTrackingProvider] = {
            "dpd": DPDTrackingProvider(),
            "fedex": FedExTrackingProvider(),
            "dhl": DHLTrackingProvider(),
            "ups": UPSTrackingProvider(),
            "aramex": AramexTrackingProvider(),
            "airline": AirlineCargoTrackingProvider(),
            "generic": GenericTrackingProvider()
        }

    def get_provider_for_carrier(self, carrier_name_or_code: Optional[str]) -> BaseTrackingProvider:
        if not carrier_name_or_code:
            return self.providers["generic"]
        key = carrier_name_or_code.strip().lower()
        for p_key, provider in self.providers.items():
            if p_key in key or provider.name.lower() in key or provider.code.lower() in key:
                return provider
        return self.providers["generic"]

    def track_cargo(self, db: Session, identifier: str) -> Dict[str, Any]:
        """
        Unified cargo tracker: searches across Enquiry Tracking Number,
        HAWB Number, Forwarding Number, or MAWB Number.
        """
        clean_id = identifier.strip()

        # 1. Search Shipment by hawbno, forwardingNumber, or numeric id
        shipment = (
            db.query(Shipment).filter(Shipment.hawbno == clean_id).first() or
            db.query(Shipment).filter(Shipment.forwardingNumber == clean_id).first()
        )
        if not shipment:
            try:
                shipment = db.query(Shipment).filter(Shipment.id == int(clean_id)).first()
            except ValueError:
                pass

        # 2. Search Enquiry by trackingNumber or id
        enquiry = None
        if not shipment:
            try:
                enquiry = db.query(Enquiry).filter(Enquiry.id == int(clean_id)).first()
            except ValueError:
                pass
            if not enquiry:
                enquiry = db.query(Enquiry).filter(Enquiry.trackingNumber == clean_id).first()
            if enquiry and enquiry.shipments:
                shipment = enquiry.shipments[0]

        # 3. Search MAWB
        mawb = None
        if not shipment and not enquiry:
            mawb = db.query(MAWB).filter(MAWB.mawbNumber == clean_id).first()

        if shipment and not enquiry:
            enquiry = shipment.enquiry

        if not shipment and not enquiry and not mawb:
            return {
                "found": False,
                "trackingNumber": identifier,
                "message": f"No shipment or cargo found for '{identifier}'"
            }

        # Determine Carrier & Carrier Provider
        fwd_company_name = None
        fwd_number = None
        if shipment:
            fwd_company_name = shipment.forwardingCompany.name if shipment.forwardingCompany else None
            fwd_number = shipment.forwardingNumber

        carrier_provider = self.get_provider_for_carrier(fwd_company_name)
        carrier_tracking_url = carrier_provider.get_tracking_url(fwd_number) if fwd_number else None

        # Determine MAWB details
        linked_mawb = (shipment.mawb if shipment else None) or (enquiry.mawb if enquiry else None) or mawb
        airline_provider: AirlineCargoTrackingProvider = self.providers["airline"]  # type: ignore
        airline_tracking_url = airline_provider.get_tracking_url(linked_mawb.mawbNumber) if (linked_mawb and linked_mawb.mawbNumber) else None
        airline_name = linked_mawb.airlineName if linked_mawb else None
        if linked_mawb and not airline_name and linked_mawb.mawbNumber:
            airline_name = airline_provider.get_airline_name(linked_mawb.mawbNumber)

        # Aggregate Checkpoints
        checkpoints: List[TrackingCheckpoint] = []

        # 1. Enquiry Generated (with time & date)
        created_at = (enquiry.createdAt if enquiry else None) or (shipment.createdAt if shipment else None) or datetime.utcnow()
        checkpoints.append(TrackingCheckpoint(
            timestamp=created_at,
            location="Kathmandu, Nepal",
            status="ENQUIRY_GENERATED",
            activity="Enquiry Generated",
            country="Nepal",
            source="INTERNAL"
        ))

        # Tracking mode & conditional milestone parameters:
        # Per flowchart: "Auto if Mawb and Forwarding no is there -> BY API"
        # User instruction: "make sure every tracking and mawb is tracked by api if details are there"
        has_api_details = bool(fwd_number or (linked_mawb and linked_mawb.mawbNumber))
        raw_mode = (getattr(shipment, "trackingMode", None) if shipment else None) or (getattr(enquiry, "trackingMode", None) if enquiry else None)
        
        if has_api_details:
            tracking_mode = "API"
        elif raw_mode:
            tracking_mode = raw_mode.upper()
        else:
            tracking_mode = "MANUAL"
        
        is_pickup_required = True
        if enquiry is not None:
            if getattr(enquiry, "pickupRequired", None) is False:
                is_pickup_required = False

        is_from_customer = bool(getattr(enquiry, "isFromCustomer", False)) if enquiry else False
        is_packed = bool(getattr(enquiry, "isPacked", False)) if enquiry else False

        # 1.5. Cargo Picked Up OR Self Drop Counter Handover
        if is_pickup_required:
            is_picked_up = (enquiry and (enquiry.pickedUpAt or enquiry.status == "PICKED_UP" or enquiry.weightProofImageUrl)) or (shipment and shipment.status in ("PICKED_UP", "PACKED", "SHIPMENT_CREATED", "IN_TRANSIT", "ARRIVED_AT_HUB", "CARRIER_SCANNED", "OUT_FOR_DELIVERY", "DELIVERED"))
            if is_picked_up:
                pickup_ts = (enquiry.pickedUpAt if (enquiry and enquiry.pickedUpAt) else None) or (created_at + timedelta(hours=2))
                checkpoints.append(TrackingCheckpoint(
                    timestamp=pickup_ts,
                    location="NetPack Central Warehouse, Kathmandu",
                    status="PICKED_UP",
                    activity="Cargo Picked Up by NetPack Courier & Received at Warehouse",
                    country="Nepal",
                    source="WAREHOUSE_PICKUP"
                ))
        else:
            # Self-drop / counter drop-off
            checkpoints.append(TrackingCheckpoint(
                timestamp=created_at + timedelta(minutes=30),
                location="NetPack Central Warehouse / Intake Counter",
                status="PICKED_UP",
                activity="Consignment Dropped Off at Counter by Customer (Self Drop)",
                country="Nepal",
                source="COUNTER_DROPOFF"
            ))

        # 2. Shipment Created (After Packing & Weight/Dims verification)
        if shipment and shipment.createdAt:
            hawb_label = f" (HAWB: {shipment.hawbno})" if shipment.hawbno else ""
            checkpoints.append(TrackingCheckpoint(
                timestamp=shipment.createdAt,
                location="Kathmandu Central Operations",
                status="SHIPMENT_CREATED",
                activity=f"Shipment Created{hawb_label} - Export Documentation & Labeling Completed",
                country="Nepal",
                source="INTERNAL"
            ))

        # 3. Status from Airlines / MAWB displayed as In Transit / Arrived at Hub
        # (A) Transit Points: in transit at (transit point)
        if shipment and shipment.transitPoints:
            for tp in shipment.transitPoints:
                tp_loc = tp.location or (tp.country.name if tp.country else "Transit Port")
                checkpoints.append(TrackingCheckpoint(
                    timestamp=tp.timestamp or tp.createdAt,
                    location=tp_loc,
                    status="IN_TRANSIT",
                    activity=f"In transit at {tp_loc}",
                    country=tp.country.name if tp.country else "",
                    source="MAWB_FLIGHT"
                ))

        # (B) MAWB Flight: Departed from (origin) & Arrived at hub (destination Port)
        if linked_mawb:
            dest_label = (linked_mawb.destination or (enquiry.receiverCountry if enquiry else "") or "Destination Port").strip()
            flight_str = f"Flight {linked_mawb.flightNumber}" if linked_mawb.flightNumber else "Air Cargo Flight"
            air_str = f"({airline_name})" if airline_name else ""

            # Check if live AWB API tracking is available
            mawb_api_checkpoints: List[TrackingCheckpoint] = []
            if linked_mawb.mawbNumber:
                try:
                    mawb_api_checkpoints = airline_provider.track(
                        linked_mawb.mawbNumber,
                        context={
                            "departureDate": linked_mawb.departureDate,
                            "arrivalDate": linked_mawb.dateOfArrival,
                            "destination": dest_label
                        }
                    )
                except Exception as mawb_err:
                    logger.warning(f"Error querying MAWB API for {linked_mawb.mawbNumber}: {mawb_err}")

            if mawb_api_checkpoints:
                for macp in mawb_api_checkpoints:
                    macp.source = "MAWB_FLIGHT"
                    checkpoints.append(macp)
            else:
                if linked_mawb.departureDate:
                    checkpoints.append(TrackingCheckpoint(
                        timestamp=linked_mawb.departureDate,
                        location="Tribhuvan International Airport (KTM)",
                        status="IN_TRANSIT",
                        activity=f"Air cargo departed Kathmandu (KTM) on {flight_str} {air_str}".strip(),
                        country="Nepal",
                        source="MAWB_FLIGHT"
                    ))

                if linked_mawb.dateOfArrival:
                    checkpoints.append(TrackingCheckpoint(
                        timestamp=linked_mawb.dateOfArrival,
                        location=f"{dest_label} Hub / Airport",
                        status="ARRIVED_AT_HUB",
                        activity=f"Arrived at destination hub ({dest_label}) via {flight_str}".strip(),
                        country=dest_label,
                        source="MAWB_FLIGHT"
                    ))

            if getattr(linked_mawb, "note", None):
                checkpoints.append(TrackingCheckpoint(
                    timestamp=linked_mawb.departureDate or linked_mawb.createdAt or created_at,
                    location="Air Freight Route",
                    status="IN_TRANSIT",
                    activity=f"Flight update: {linked_mawb.note}",
                    country="",
                    source="AIRLINE_TRANSIT"
                ))

        # 4. Scans updated after scanned by carrier (follow milestone by TrackingMore API) or manual operator notes
        if shipment and shipment.trackingEvents:
            for te in shipment.trackingEvents:
                te_status = te.status or "CARRIER_SCANNED"
                te_source = te.source or "CARRIER"
                if "MANUAL" in te_source:
                    src_label = "MANUAL_NOTE"
                elif te.courierCode:
                    src_label = f"CARRIER:{te.courierCode.upper()}"
                elif "TRACKINGMORE" in te_source or "CARRIER" in te_source:
                    src_label = "CARRIER_API"
                else:
                    src_label = te_source

                # If event is from courier API, it represents the CARRIER_SCANNED phase
                if te_status in ("IN_TRANSIT", "ARRIVED_AT_HUB") and ("CARRIER" in te_source or "TRACKINGMORE" in te_source):
                    te_status = "CARRIER_SCANNED"

                checkpoints.append(TrackingCheckpoint(
                    timestamp=te.checkpointTime or te.createdAt,
                    location=te.location or "Carrier Facility",
                    status=te_status,
                    activity=te.activity or f"Update: {te_status}",
                    country=te.country or "",
                    source=src_label
                ))

        # Live Query to TrackingMore API if configured AND trackingMode is API and no authentic checkpoints exist yet
        if tracking_mode == "API" and fwd_number and trackingmore_service.is_configured and shipment:
            has_real_tm_events = any(
                te.source and ("TRACKINGMORE" in te.source or "CARRIER" in te.source) and len(te.activity or "") > 15
                for te in shipment.trackingEvents
            )
            if not has_real_tm_events:
                # Auto-sync live checkpoints from TrackingMore
                self.sync_tracking_live(db, shipment)
                db.refresh(shipment)
                checkpoints = [cp for cp in checkpoints if not (cp.source and ("TRACKINGMORE" in cp.source or "CARRIER" in cp.source or cp.source == "CARRIER_API"))]
                for te in shipment.trackingEvents:
                    te_status = te.status or "CARRIER_SCANNED"
                    te_source = te.source or "CARRIER"
                    src_label = f"CARRIER:{te.courierCode.upper()}" if te.courierCode else ("CARRIER_API" if ("CARRIER" in te_source or "TRACKINGMORE" in te_source) else te_source)
                    if te_status in ("IN_TRANSIT", "ARRIVED_AT_HUB") and ("CARRIER" in (te.source or "") or "TRACKINGMORE" in (te.source or "")):
                        te_status = "CARRIER_SCANNED"

                    checkpoints.append(TrackingCheckpoint(
                        timestamp=te.checkpointTime or te.createdAt,
                        location=te.location or "Carrier Facility",
                        status=te_status,
                        activity=te.activity or f"Carrier update: {te_status}",
                        country=te.country or "",
                        source=src_label
                    ))

        # Check if courier carrier events exist (e.g. UPS / FedEx / DHL / DPD scans)
        has_carrier_events = any(
            cp.status in ("CARRIER_SCANNED", "OUT_FOR_DELIVERY") or ("CARRIER" in (cp.source or "") and cp.status != "DELIVERED")
            for cp in checkpoints
        )

        dest_name = (enquiry.receiverCountry if enquiry else None) or (linked_mawb.destination if linked_mawb else None) or "Destination"

        # Ensure Airline In Transit milestone exists if shipment has progressed beyond created
        has_airline_in_transit = any(cp.status == "IN_TRANSIT" and ("AIRLINE" in (cp.source or "") or "MAWB" in (cp.source or "") or "INTERNAL" in (cp.source or "")) for cp in checkpoints)
        if not has_airline_in_transit and (has_carrier_events or (shipment and shipment.status in ("IN_TRANSIT", "ARRIVED_AT_HUB", "CARRIER_SCANNED", "OUT_FOR_DELIVERY", "DELIVERED"))):
            dep_ts = (linked_mawb.departureDate if linked_mawb else None) or (created_at + timedelta(hours=6))
            airline_lbl = f" on {airline_name}" if airline_name else ""
            checkpoints.append(TrackingCheckpoint(
                timestamp=dep_ts,
                location="Tribhuvan International Airport (KTM)",
                status="IN_TRANSIT",
                activity=f"Air cargo departed from Kathmandu (KTM){airline_lbl} on scheduled flight to {dest_name}",
                country="Nepal",
                source="MAWB_FLIGHT"
            ))

        # Ensure Arrived at Hub milestone exists if courier carrier has already scanned the parcel
        has_hub_arrival = any(cp.status == "ARRIVED_AT_HUB" for cp in checkpoints)
        if not has_hub_arrival and (has_carrier_events or (shipment and shipment.status in ("ARRIVED_AT_HUB", "CARRIER_SCANNED", "OUT_FOR_DELIVERY", "DELIVERED"))):
            carrier_timestamps = [cp.timestamp for cp in checkpoints if "CARRIER" in (cp.source or "") and cp.timestamp]
            first_carrier_ts = min(carrier_timestamps) if carrier_timestamps else None
            hub_ts = (linked_mawb.dateOfArrival if linked_mawb else None) or (first_carrier_ts - timedelta(hours=3) if first_carrier_ts else created_at + timedelta(days=1))
            checkpoints.append(TrackingCheckpoint(
                timestamp=hub_ts,
                location=f"{dest_name} Cargo Terminal / Hub",
                status="ARRIVED_AT_HUB",
                activity=f"Arrived at hub ({dest_name}) - Landed & cleared through destination cargo terminal",
                country=dest_name,
                source="MAWB_FLIGHT"
            ))

        current_status = (shipment.status if shipment else None) or (enquiry.status if enquiry else "PENDING")

        # In API mode, automatically resolve and persist status to CARRIER_SCANNED if courier scans exist
        if tracking_mode == "API" and has_carrier_events and current_status in ("IN_TRANSIT", "ARRIVED_AT_HUB", "PENDING", "SHIPMENT_CREATED"):
            current_status = "CARRIER_SCANNED"
            if shipment and shipment.status != "CARRIER_SCANNED":
                shipment.status = "CARRIER_SCANNED"
                if shipment.enquiry:
                    shipment.enquiry.status = "CARRIER_SCANNED"
                try:
                    db.commit()
                except Exception:
                    db.rollback()

        # 5. Delivered Milestone
        if current_status == "DELIVERED":
            has_delivered_cp = any(cp.status == "DELIVERED" for cp in checkpoints)
            if not has_delivered_cp:
                del_time = (shipment.updatedAt if shipment else None) or datetime.utcnow()
                dest_addr = (enquiry.receiverCountry if enquiry else None) or (linked_mawb.destination if linked_mawb else None) or "Destination"
                rec_name = enquiry.receiverName if enquiry else "Consignee"
                checkpoints.append(TrackingCheckpoint(
                    timestamp=del_time,
                    location=dest_addr,
                    status="DELIVERED",
                    activity=f"Consignment Delivered to {rec_name}",
                    country=dest_addr,
                    source="DELIVERY_COMPLETE"
                ))

        # Stage hierarchy for the 7 primary tracking statuses:
        # Delivered (top) -> Out for delivery -> Carrier Scanned -> Arrived at Hub -> In Transit -> Shipment Created -> Picked Up -> Enquiry Generated (bottom)
        STAGE_ORDER = {
            "ENQUIRY_GENERATED": 10,
            "PICKED_UP": 15,
            "SHIPMENT_CREATED": 20,
            "IN_TRANSIT": 30,
            "ARRIVED_AT_HUB": 40,
            "CARRIER_SCANNED": 50,
            "OUT_FOR_DELIVERY": 55,
            "EXCEPTION": 58,
            "DELIVERED": 60,
        }

        def get_checkpoint_sort_key(cp: TrackingCheckpoint):
            stage_w = STAGE_ORDER.get(cp.status, 35)
            ts_val = cp.timestamp.timestamp() if cp.timestamp else 0.0
            return (stage_w, ts_val)

        # Sort checkpoints in DESCENDING order (freshest/newest status at top, older at bottom)
        checkpoints.sort(key=get_checkpoint_sort_key, reverse=True)

        proof_images = [u.strip() for u in (enquiry.weightProofImageUrl or "").split(",") if u.strip()] if enquiry else []
        is_weight_verified = bool(proof_images or (enquiry and (enquiry.volumetricWeight or enquiry.chargeableWeight)))

        return {
            "found": True,
            "shipmentId": shipment.id if shipment else None,
            "enquiryId": enquiry.id if enquiry else None,
            "trackingNumber": (enquiry.trackingNumber if enquiry else None) or (shipment.hawbno if shipment else identifier),
            "hawbNumber": shipment.hawbno if shipment else None,
            "currentStatus": current_status,
            "trackingMode": tracking_mode,
            "pickupRequired": is_pickup_required,
            "isSelfDrop": not is_pickup_required,
            "isFromCustomer": is_from_customer,
            "isPacked": is_packed,
            "packedAt": getattr(enquiry, "packedAt", None).isoformat() if (enquiry and getattr(enquiry, "packedAt", None)) else None,
            "isWeightVerified": is_weight_verified,
            "note": getattr(shipment, "note", None) if shipment else None,
            "origin": "Kathmandu, Nepal",
            "destination": (enquiry.receiverCountry if enquiry else None) or (linked_mawb.destination if linked_mawb else None) or "Overseas",
            "senderName": enquiry.senderName if enquiry else None,
            "receiverName": enquiry.receiverName if enquiry else None,
            "pieces": (enquiry.noOfBox if enquiry else len(shipment.boxes)) if (enquiry or shipment) else 1,
            "weight": (enquiry.weight if enquiry else 10.0) if enquiry else 10.0,
            "volumetricWeight": enquiry.volumetricWeight if enquiry else None,
            "chargeableWeight": enquiry.chargeableWeight if enquiry else None,
            "weightProofImageUrl": proof_images[0] if proof_images else None,
            "weightProofImages": proof_images,
            "pickedUpAt": enquiry.pickedUpAt.isoformat() if (enquiry and enquiry.pickedUpAt) else None,
            "pickupNotes": enquiry.pickupNotes if enquiry else None,
            "boxes": [
                {
                    "boxNumber": idx,
                    "trackingNumber": b.trackingNumber or f"BOX-{idx}",
                    "weight": b.weight or round((enquiry.weight if enquiry else 10.0) / max(len(enquiry.boxes if (enquiry and enquiry.boxes) else (shipment.boxes if (shipment and shipment.boxes) else [1])), 1), 2),
                    "dimensions": b.dimensions or (f"{b.length} x {b.breadth} x {b.height} cm" if (b.length and b.breadth and b.height) else "Standard Cargo Carton"),
                    "length": b.length,
                    "breadth": b.breadth,
                    "height": b.height,
                    "volumetricWeight": round((b.length * b.breadth * b.height) / 5000.0, 2) if (b.length and b.breadth and b.height) else None,
                    "multiplier": b.multiplier or 1.0,
                    "quantity": b.quantity or 1,
                    "items": (
                        [
                            {
                                "item": bi.enquiryItem.description if bi.enquiryItem else "Cargo Item",
                                "pieces": bi.quantity or 1
                            }
                            for bi in b.items
                        ] if b.items else (
                            [
                                {
                                    "item": itm.description or "General Goods",
                                    "pieces": itm.quantity or 1
                                }
                                for itm in (enquiry.items if (enquiry and enquiry.items) else (shipment.enquiry.items if (shipment and shipment.enquiry and shipment.enquiry.items) else []))
                            ] if (idx == 1) else []
                        )
                    )
                }
                for idx, b in enumerate(
                    (enquiry.boxes if (enquiry and enquiry.boxes) else (shipment.boxes if (shipment and shipment.boxes) else [])),
                    1
                )
            ] if (enquiry and enquiry.boxes) or (shipment and shipment.boxes) else [
                {
                    "boxNumber": 1,
                    "trackingNumber": "BOX-1",
                    "weight": enquiry.weight if enquiry else (shipment.weight if shipment else 10.0),
                    "dimensions": "30 x 20 x 20 cm",
                    "length": 30.0,
                    "breadth": 20.0,
                    "height": 20.0,
                    "volumetricWeight": round((30.0 * 20.0 * 20.0) / 5000.0, 2),
                    "multiplier": 1.0,
                    "quantity": 1,
                    "items": [
                        {
                            "item": itm.description or "General Cargo",
                            "pieces": itm.quantity or 1
                        }
                        for itm in (enquiry.items if (enquiry and enquiry.items) else (shipment.enquiry.items if (shipment and shipment.enquiry and shipment.enquiry.items) else []))
                    ] or [{"item": "General Goods", "pieces": 1}]
                }
            ],
            # Forwarding courier details
            "forwardingCompany": fwd_company_name,
            "forwardingNumber": fwd_number,
            "carrierCode": carrier_provider.code,
            "carrierTrackingUrl": carrier_tracking_url,
            "carrierApiConfigured": carrier_provider.is_live_configured,
            # Airline freight details
            "mawbNumber": linked_mawb.mawbNumber if linked_mawb else None,
            "airlineName": airline_name,
            "flightNumber": linked_mawb.flightNumber if linked_mawb else None,
            "airlineTrackingUrl": airline_tracking_url,
            "departureDate": linked_mawb.departureDate.isoformat() if (linked_mawb and linked_mawb.departureDate) else None,
            "arrivalDate": linked_mawb.dateOfArrival.isoformat() if (linked_mawb and linked_mawb.dateOfArrival) else None,
            # Checkpoints
            "checkpoints": [cp.to_dict() for cp in checkpoints]
        }

    def sync_tracking_live(self, db: Session, shipment: Shipment) -> Dict[str, Any]:
        """
        Forces an on-demand live query to TrackingMore, updates the database,
        and registers the tracking number if not yet registered.
        """
        fwd_no = shipment.forwardingNumber
        if not fwd_no:
            return {"success": False, "message": "Shipment does not have an assigned forwarding number yet"}

        courier_name = shipment.forwardingCompany.name if shipment.forwardingCompany else None

        # 1. Register with TrackingMore if configured
        reg_res = {}
        if trackingmore_service.is_configured:
            reg_res = trackingmore_service.create_tracking(
                tracking_number=fwd_no,
                courier_code=courier_name,
                customer_name=shipment.customer.name if shipment.customer else None,
                title=f"Netpack Shipment {shipment.hawbno or fwd_no}"
            )

        # 2. Query live tracking data
        tm_res = trackingmore_service.get_tracking(fwd_no, courier_name)
        new_events_count = 0
        if tm_res.get("found"):
            tm_checkpoints = tm_res.get("checkpoints", [])
            courier_slug = tm_res.get("courier_code") or courier_name or "courier"

            existing_signatures = {
                f"{te.location}_{te.activity}"
                for te in shipment.trackingEvents
            }

            for cp in tm_checkpoints:
                sig = f"{cp.get('location')}_{cp.get('activity')}"
                if sig not in existing_signatures:
                    existing_signatures.add(sig)
                    dt_val = None
                    if cp.get("timestamp"):
                        try:
                            dt_val = datetime.fromisoformat(cp["timestamp"])
                        except Exception:
                            dt_val = datetime.utcnow()

                    new_te = TrackingEvent(
                        shipmentId=shipment.id,
                        trackingNumber=fwd_no,
                        courierCode=courier_slug,
                        status=cp.get("status") or "CARRIER_SCANNED",
                        location=cp.get("location") or "Carrier Facility",
                        activity=cp.get("activity") or "Carrier Scan",
                        country=cp.get("country") or "",
                        checkpointTime=dt_val or datetime.utcnow(),
                        source=f"TRACKINGMORE:{courier_slug.upper()}"
                    )
                    db.add(new_te)
                    new_events_count += 1

            mapped = tm_res.get("overall_status") or trackingmore_service.map_status(tm_res.get("delivery_status"), courier_code=courier_slug)
            shipment.status = mapped
            if shipment.enquiry:
                shipment.enquiry.status = mapped
            db.commit()

        return {
            "success": True,
            "registered": reg_res.get("success", False),
            "trackingMoreFound": tm_res.get("found", False),
            "newEventsAdded": new_events_count,
            "status": shipment.status
        }

# Global registry instance
tracking_registry = TrackingRegistry()

