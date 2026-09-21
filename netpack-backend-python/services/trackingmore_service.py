import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import requests

import config

logger = logging.getLogger("trackingmore")


class TrackingMoreService:
    """
    TrackingMore API v4 Client for Couriers & Air Cargo.
    Docs: https://www.trackingmore.com/v4/api-index.html
    """
    BASE_URL = "https://api.trackingmore.com/v4"

    # Canonical courier slug mapping for TrackingMore
    COURIER_MAP = {
        "fedex": "fedex",
        "dhl": "dhl",
        "dhl express": "dhl",
        "dpd": "dpd",
        "dpd uk": "dpd-uk",
        "dpd de": "dpd-de",
        "ups": "ups",
        "aramex": "aramex",
        "usps": "usps",
        "skynet": "skynetworldwide",
        "tnt": "tnt",
        "ems": "ems",
        "royal mail": "royal-mail",
        # Major Airline Cargo prefixes / codes supported
        "emirates": "emirates",
        "qatar": "qatar-airways",
        "qatar airways": "qatar-airways",
        "air india": "air-india",
        "klm": "klm",
        "lufthansa": "lufthansa",
        "british airways": "british-airways",
    }

    def __init__(self):
        self.api_key = config.TRACKINGMORE_API_KEY
        self.webhook_secret = config.TRACKINGMORE_WEBHOOK_SECRET

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def get_masked_key(self) -> str:
        if not self.is_configured:
            return ""
        key = self.api_key.strip()
        if len(key) <= 8:
            return "****"
        return f"{key[:4]}...{key[-4:]}"

    @property
    def has_secret(self) -> bool:
        return bool(self.webhook_secret and self.webhook_secret.strip())

    def get_masked_secret(self) -> str:
        if not self.has_secret:
            return ""
        sec = self.webhook_secret.strip()
        if len(sec) <= 8:
            return "****"
        return f"{sec[:4]}...{sec[-4:]}"

    def update_credentials(self, api_key: str, webhook_secret: Optional[str] = None) -> bool:
        """
        Updates in-memory credentials and persists them to the .env file.
        """
        clean_key = (api_key or "").strip()
        clean_secret = (webhook_secret or "").strip()

        self.api_key = clean_key
        if webhook_secret is not None:
            self.webhook_secret = clean_secret

        config.TRACKINGMORE_API_KEY = self.api_key
        config.TRACKINGMORE_WEBHOOK_SECRET = self.webhook_secret
        os.environ["TRACKINGMORE_API_KEY"] = self.api_key
        os.environ["TRACKINGMORE_WEBHOOK_SECRET"] = self.webhook_secret

        # Persist to .env file
        try:
            env_file = config.ENV_FILE
            lines = []
            if env_file.exists():
                with open(env_file, "r", encoding="utf-8") as f:
                    lines = f.readlines()

            key_found = False
            secret_found = False
            new_lines = []

            for line in lines:
                stripped = line.strip()
                if stripped.startswith("TRACKINGMORE_API_KEY="):
                    new_lines.append(f"TRACKINGMORE_API_KEY={clean_key}\n")
                    key_found = True
                elif stripped.startswith("TRACKINGMORE_WEBHOOK_SECRET="):
                    new_lines.append(f"TRACKINGMORE_WEBHOOK_SECRET={clean_secret}\n")
                    secret_found = True
                else:
                    new_lines.append(line)

            if not key_found:
                new_lines.append(f"TRACKINGMORE_API_KEY={clean_key}\n")
            if not secret_found and clean_secret:
                new_lines.append(f"TRACKINGMORE_WEBHOOK_SECRET={clean_secret}\n")

            with open(env_file, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
            logger.info("TrackingMore credentials persisted to .env")
            return True
        except Exception as e:
            logger.error(f"Failed to persist TrackingMore credentials to .env: {e}")
            return False

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Tracking-Api-Key": self.api_key.strip(),
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def normalize_courier_code(self, carrier_name_or_code: Optional[str]) -> Optional[str]:
        if not carrier_name_or_code:
            return None
        clean = carrier_name_or_code.strip().lower()
        for key, slug in self.COURIER_MAP.items():
            if key in clean or clean in key:
                return slug
        return clean.replace(" ", "-")

    def detect_courier(self, tracking_number: str) -> Optional[str]:
        """Detect courier code using TrackingMore auto-detection endpoint."""
        if not self.is_configured:
            return None
        try:
            url = f"{self.BASE_URL}/carriers/detect"
            payload = {"tracking_number": tracking_number.strip()}
            resp = requests.post(url, json=payload, headers=self._get_headers(), timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("data", [])
                if items and isinstance(items, list):
                    return items[0].get("courier_code")
        except Exception as e:
            logger.warning(f"Failed to detect courier with TrackingMore: {e}")
        return None

    def create_tracking(
        self,
        tracking_number: str,
        courier_code: Optional[str] = None,
        customer_name: Optional[str] = None,
        title: Optional[str] = None,
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Registers a tracking number with TrackingMore for continuous monitoring & webhook triggers.
        """
        clean_num = tracking_number.strip()
        slug = self.normalize_courier_code(courier_code) or self.detect_courier(clean_num)

        if not self.is_configured:
            return {
                "success": False,
                "configured": False,
                "message": "TrackingMore API key is not configured. Add TRACKINGMORE_API_KEY in .env"
            }

        if not slug:
            return {
                "success": False,
                "configured": True,
                "message": f"Could not determine courier code for tracking number '{clean_num}'"
            }

        url = f"{self.BASE_URL}/trackings/create"
        body = {
            "tracking_number": clean_num,
            "courier_code": slug,
            "customer_name": customer_name or "",
            "title": title or f"Netpack Shipment {clean_num}",
            "note": note or "Tracked via Netpack Logistics Integration"
        }

        try:
            resp = requests.post(url, json=body, headers=self._get_headers(), timeout=12)
            res_data = resp.json() if resp.text else {}
            code = res_data.get("meta", {}).get("code") or res_data.get("code")

            # 200/201 = success; 4016 / 40016 = tracking number already exists in account
            if resp.status_code in (200, 201) or code in (200, 201, 4016, 40016):
                return {
                    "success": True,
                    "tracking_number": clean_num,
                    "courier_code": slug,
                    "already_existed": code in (4016, 40016),
                    "data": res_data.get("data", {})
                }
            return {
                "success": False,
                "message": res_data.get("meta", {}).get("message") or res_data.get("message") or resp.text
            }
        except Exception as e:
            return {"success": False, "message": str(e)}

    def create_awb(self, awb_number: str) -> Dict[str, Any]:
        """
        Registers an Air Waybill (MAWB) with TrackingMore AWB tracking API.
        Endpoint: POST /v4/awb/create
        """
        clean_num = awb_number.replace(" ", "")
        if not self.is_configured:
            return {"success": False, "configured": False, "message": "TrackingMore API key not configured"}

        url = f"{self.BASE_URL}/awb/create"
        payload = {"awb_number": clean_num}

        try:
            resp = requests.post(url, json=payload, headers=self._get_headers(), timeout=12)
            res_data = resp.json() if resp.content else {}
            meta = res_data.get("meta", {})
            if resp.status_code in (200, 201) and meta.get("code") in (200, 201):
                return {"success": True, "data": res_data.get("data")}

            if meta.get("code") == 4190 or "quota" in str(res_data).lower():
                return {
                    "success": False,
                    "quota_exceeded": True,
                    "message": "TrackingMore AWB quota exceeded (0/5 credits). Please upgrade AWB plan in TrackingMore."
                }
            return {
                "success": False,
                "message": meta.get("message") or resp.text
            }
        except Exception as e:
            return {"success": False, "message": str(e)}

    def get_awb(self, awb_number: str) -> Dict[str, Any]:
        """
        Queries real-time Air Waybill (MAWB) tracking from TrackingMore AWB API.
        Endpoint: GET /v4/awb/get?awb_numbers={awb_number}
        """
        clean_num = awb_number.replace(" ", "")
        if not self.is_configured:
            return {"found": False, "configured": False, "message": "TrackingMore API key not configured"}

        url = f"{self.BASE_URL}/awb/get"
        params = {"awb_numbers": clean_num}

        try:
            resp = requests.get(url, params=params, headers=self._get_headers(), timeout=12)
            res_data = resp.json() if resp.content else {}
            meta = res_data.get("meta", {})

            if meta.get("code") == 4190 or "quota" in str(res_data).lower():
                return {
                    "found": False,
                    "configured": True,
                    "quota_exceeded": True,
                    "message": "TrackingMore AWB quota limitation reached (0/5 credits). Upgrade AWB plan in TrackingMore to enable live airline tracking."
                }

            if resp.status_code == 200 and meta.get("code") == 200:
                success_list = res_data.get("data", {}).get("success", [])
                if success_list:
                    item = success_list[0]
                    return {
                        "found": True,
                        "configured": True,
                        "awb_number": clean_num,
                        "awb_status": item.get("awb_status"),
                        "origin": item.get("origin"),
                        "destination": item.get("destination"),
                        "flight_info": item.get("flight_info"),
                        "flight_info_new": item.get("flight_info_new"),
                        "last_event": item.get("last_event"),
                        "raw_data": item
                    }
        except Exception as e:
            logger.error(f"Error querying TrackingMore AWB: {e}")

        return {"found": False, "configured": True, "message": "No live TrackingMore AWB record found"}

    def get_tracking(self, tracking_number: str, courier_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Queries real-time tracking information from TrackingMore.
        """
        clean_num = tracking_number.strip()
        slug = self.normalize_courier_code(courier_code)

        if not self.is_configured:
            return {"found": False, "configured": False, "message": "TrackingMore API key not configured"}

        url = f"{self.BASE_URL}/trackings/get"
        params = {"tracking_numbers": clean_num}
        if slug:
            params["courier_code"] = slug

        try:
            resp = requests.get(url, params=params, headers=self._get_headers(), timeout=12)
            if resp.status_code == 200:
                res_data = resp.json()
                items = res_data.get("data", [])
                if items and isinstance(items, list) and len(items) > 0:
                    raw_info = items[0]
                    checkpoints = self.extract_checkpoints_from_data(raw_info)

                    # Compute best overall status
                    del_status = raw_info.get("delivery_status")
                    latest_substatus = raw_info.get("substatus") or raw_info.get("latest_substatus") or ""
                    milestone_date = raw_info.get("milestone_date") or {}
                    latest_event = raw_info.get("latest_event") or ""
                    c_code = raw_info.get("courier_code") or courier_name
                    mapped_overall = self.map_status(
                        tm_status=del_status,
                        substatus=latest_substatus,
                        activity=latest_event,
                        courier_code=c_code
                    )

                    # If checkpoints exist and latest checkpoint has a more advanced status, respect it
                    if checkpoints:
                        latest_cp = checkpoints[-1]
                        if mapped_overall in ("IN_TRANSIT", "ARRIVED_AT_HUB") and latest_cp.get("status") in ("CARRIER_SCANNED", "OUT_FOR_DELIVERY", "DELIVERED"):
                            mapped_overall = latest_cp["status"]

                    return {
                        "found": True,
                        "configured": True,
                        "tracking_number": clean_num,
                        "courier_code": raw_info.get("courier_code"),
                        "delivery_status": del_status,
                        "overall_status": mapped_overall,
                        "latest_event": latest_event,
                        "latest_checkpoint_time": raw_info.get("latest_checkpoint_time"),
                        "raw_info": raw_info,
                        "checkpoints": checkpoints
                    }
        except Exception as e:
            logger.error(f"Error querying TrackingMore: {e}")

        return {"found": False, "configured": True, "message": "No live TrackingMore record found"}

    AIRLINE_COURIER_CODES = {
        "emirates", "qatar", "qatar-airways", "air-india", "klm", "lufthansa", "british-airways", "airline", "airline_mawb"
    }

    def map_status(
        self,
        tm_status: Optional[str] = None,
        substatus: Optional[str] = None,
        activity: Optional[str] = None,
        courier_code: Optional[str] = None
    ) -> str:
        """
        Maps TrackingMore delivery_status, substatus, and checkpoint activity
        to Netpack standard lifecycle phases:
        - ENQUIRY_GENERATED
        - SHIPMENT_CREATED
        - IN_TRANSIT (Airline air freight phase)
        - ARRIVED_AT_HUB (Destination airport cargo terminal arrival)
        - CARRIER_SCANNED (Courier carrier like UPS/FedEx/DHL/DPD has scanned cargo)
        - OUT_FOR_DELIVERY (Courier final delivery run)
        - DELIVERED (Successfully delivered to consignee)
        """
        s = (tm_status or "").lower().strip()
        sub = (substatus or "").lower().strip()
        act = (activity or "").lower().strip()
        courier = (courier_code or "").lower().strip()
        is_airline = any(ac in courier for ac in self.AIRLINE_COURIER_CODES)

        # 1. DELIVERED
        if s == "delivered" or "delivered" in sub or "delivered" in act:
            return "DELIVERED"

        # 2. OUT FOR DELIVERY
        if (
            s in ("out_for_delivery", "outfordelivery")
            or sub in ("transit003", "out_for_delivery", "outfordelivery")
            or "out for delivery" in act
            or "with delivery courier" in act
            or "loaded onto delivery vehicle" in act
        ):
            return "OUT_FOR_DELIVERY"

        # 3. EXCEPTIONS & TERMINAL STATES
        if s in ("undelivered", "exception", "failed_attempt") or "exception" in sub or "failed" in act:
            return "EXCEPTION"
        if s in ("expired", "cancelled") or "cancelled" in act:
            return "CANCELLED"
        if s in ("pending", "notfound"):
            return "PENDING"

        # 4. AIRLINE FREIGHT TRACKING (Airline Air Cargo phase)
        if is_airline:
            if (
                sub in ("transit005", "transit002", "transit004")
                or "arrived at hub" in act
                or "destination hub" in act
                or "arrived at facility" in act
                or "landed" in act
            ):
                return "ARRIVED_AT_HUB"
            return "IN_TRANSIT"

        # 5. COURIER CARRIER TRACKING (UPS, FedEx, DHL, DPD, Aramex, etc.)
        # In NetPack's logistics lifecycle:
        # "IN_TRANSIT" is strictly the airline flight / freight phase from Nepal.
        # Once the shipment is received and scanned by the courier carrier (UPS, etc.),
        # the status in NetPack's system is CARRIER_SCANNED.
        return "CARRIER_SCANNED"

    def extract_checkpoints_from_data(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parses origin_info.trackinfo and destination_info.trackinfo from TrackingMore into standard checkpoints.
        Handles TrackingMore API v4 fields (tracking_detail, checkpoint_date, checkpoint_delivery_status/substatus, location).
        """
        results: List[Dict[str, Any]] = []
        seen_keys = set()

        def add_trackinfo(tracks: List[Dict[str, Any]], carrier_slug: str):
            for t in tracks or []:
                date_str = (
                    t.get("checkpoint_date")
                    or t.get("Date")
                    or t.get("date")
                    or t.get("checkpoint_time")
                )

                # TrackingMore v4 puts the actual carrier scan description into 'tracking_detail'
                tracking_detail = (
                    t.get("tracking_detail")
                    or t.get("StatusDescription")
                    or t.get("status_description")
                    or t.get("Details")
                    or t.get("details")
                    or t.get("checkpoint_delivery_substatus")
                    or ""
                ).strip()

                loc_str = (
                    t.get("location")
                    or t.get("Location")
                    or t.get("checkpoint_location")
                )
                if not loc_str:
                    city = t.get("city") or ""
                    state = t.get("state") or ""
                    country = t.get("country_iso2") or t.get("country") or ""
                    parts = [p for p in (city, state, country) if p]
                    loc_str = " ".join(parts) if parts else "Carrier Facility"
                loc_str = loc_str.strip()

                if not date_str and not tracking_detail:
                    continue

                dedup_key = f"{date_str}_{loc_str}_{tracking_detail}"
                if dedup_key in seen_keys:
                    continue
                seen_keys.add(dedup_key)

                dt = None
                if date_str:
                    for fmt in (
                        "%Y-%m-%dT%H:%M:%S%z",
                        "%Y-%m-%dT%H:%M:%SZ",
                        "%Y-%m-%dT%H:%M:%S",
                        "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%d %H:%M",
                        "%Y-%m-%d"
                    ):
                        try:
                            dt = datetime.strptime(date_str.strip()[:19], fmt[:19])
                            break
                        except Exception:
                            pass

                status_code = t.get("checkpoint_delivery_status") or t.get("checkpoint_status") or t.get("status")
                substatus_code = t.get("checkpoint_delivery_substatus") or t.get("substatus")

                mapped_st = self.map_status(
                    tm_status=status_code,
                    substatus=substatus_code,
                    activity=tracking_detail,
                    courier_code=carrier_slug
                )

                country_code = t.get("country_iso2") or t.get("country") or ""

                results.append({
                    "timestamp": dt.isoformat() if dt else date_str,
                    "dt_object": dt or datetime.min,
                    "location": loc_str,
                    "status": mapped_st,
                    "activity": tracking_detail,
                    "country": country_code,
                    "source": f"TRACKINGMORE:{carrier_slug.upper()}" if carrier_slug else "TRACKINGMORE",
                    "courier_code": carrier_slug
                })

        # Origin trackinfo
        origin = data.get("origin_info") or {}
        add_trackinfo(origin.get("trackinfo") or [], data.get("courier_code") or origin.get("courier_code") or "courier")

        # Destination trackinfo
        dest = data.get("destination_info") or {}
        add_trackinfo(dest.get("trackinfo") or [], dest.get("courier_code") or data.get("courier_code") or "courier")

        # Sort chronologically
        results.sort(key=lambda x: x.get("dt_object", datetime.min))
        # Remove helper dt_object
        for r in results:
            r.pop("dt_object", None)

        return results


trackingmore_service = TrackingMoreService()
