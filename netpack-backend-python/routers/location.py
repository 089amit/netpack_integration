from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import urllib.request
import urllib.parse
import json
import config
from database import get_db
from models.location import Country, City, Zone, AreaSurcharge
from schemas.location import (
    CountryCreateRequest, CountryUpdateRequest,
    CityCreateRequest, CityUpdateRequest,
    ZoneCreateRequest, ZoneUpdateRequest,
    VerifyAddressRequest
)

router = APIRouter(prefix="/api/location", tags=["Location"])

# --- COUNTRIES ---

@router.get("/country")
def get_all_countries(search: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Country)
    if search:
        q = q.filter(Country.name.ilike(f"%{search}%"))
    countries = q.all()
    res = [
        {
            "id": c.id,
            "name": c.name,
            "isActive": c.isActive,
            "boxWeightLimit": c.boxWeightLimit,
            "zoneId": c.zoneId,
            "zone": {"id": c.zone.id, "name": c.zone.name} if c.zone else None
        }
        for c in countries
    ]
    return {"data": res}

@router.get("/getCountry")
def get_country_list(db: Session = Depends(get_db)):
    countries = db.query(Country).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "isActive": c.isActive,
            "boxWeightLimit": c.boxWeightLimit,
            "zoneId": c.zoneId
        }
        for c in countries
    ]

@router.get("/country-with-rates")
def get_countries_with_rates(db: Session = Depends(get_db)):
    countries = db.query(Country).all()
    res = []
    for c in countries:
        res.append({
            "id": c.id,
            "name": c.name,
            "isActive": c.isActive,
            "boxWeightLimit": c.boxWeightLimit,
            "zoneId": c.zoneId,
            "rates": [
                {
                    "id": r.id,
                    "rate": r.rate,
                    "weightFrom": r.weightFrom,
                    "weightTo": r.weightTo,
                    "isPerKg": r.isPerKg
                }
                for r in c.rates
            ]
        })
    return {"data": res}

@router.get("/country/{id}")
def get_country_by_id(id: int, db: Session = Depends(get_db)):
    c = db.query(Country).filter(Country.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Country not found")
    return {
        "id": c.id,
        "name": c.name,
        "isActive": c.isActive,
        "boxWeightLimit": c.boxWeightLimit,
        "zoneId": c.zoneId,
        "zone": {"id": c.zone.id, "name": c.zone.name} if c.zone else None
    }

@router.post("/country")
def create_country(payload: CountryCreateRequest, db: Session = Depends(get_db)):
    zone_id = None
    if payload.zoneId:
        try:
            zone_id = int(payload.zoneId)
        except (ValueError, TypeError):
            zone_id = None

    c = Country(
        name=payload.name,
        boxWeightLimit=payload.boxWeightLimit,
        zoneId=zone_id,
        isActive=payload.isActive if payload.isActive is not None else True
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "name": c.name,
        "isActive": c.isActive,
        "boxWeightLimit": c.boxWeightLimit,
        "zoneId": c.zoneId
    }

@router.post("/country/bulk")
def bulk_upload_countries(countries: List[CountryCreateRequest], db: Session = Depends(get_db)):
    added = []
    for item in countries:
        c = db.query(Country).filter(Country.name == item.name).first()
        if not c:
            zone_id = None
            if item.zoneId:
                try:
                    zone_id = int(item.zoneId)
                except (ValueError, TypeError):
                    zone_id = None
            c = Country(
                name=item.name,
                boxWeightLimit=item.boxWeightLimit,
                zoneId=zone_id,
                isActive=item.isActive if item.isActive is not None else True
            )
            db.add(c)
            added.append(c)
    db.commit()
    return {"message": f"{len(added)} countries uploaded successfully"}

@router.put("/country/{id}")
def update_country(id: int, payload: CountryUpdateRequest, db: Session = Depends(get_db)):
    c = db.query(Country).filter(Country.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Country not found")
    if payload.name is not None:
        c.name = payload.name
    if payload.boxWeightLimit is not None:
        c.boxWeightLimit = payload.boxWeightLimit
    if payload.zoneId is not None:
        try:
            c.zoneId = int(payload.zoneId) if payload.zoneId else None
        except (ValueError, TypeError):
            c.zoneId = None
    if payload.isActive is not None:
        c.isActive = payload.isActive
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "name": c.name,
        "isActive": c.isActive,
        "boxWeightLimit": c.boxWeightLimit,
        "zoneId": c.zoneId
    }

@router.delete("/country/{id}")
def delete_country(id: int, db: Session = Depends(get_db)):
    c = db.query(Country).filter(Country.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Country not found")
    db.delete(c)
    db.commit()
    return {"message": "Country deleted successfully"}

# --- CITIES ---

@router.get("/city")
def get_all_cities(db: Session = Depends(get_db)):
    return db.query(City).all()

@router.get("/city/{id}")
def get_city_by_id(id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city

@router.get("/city/cityByCountry/{countryId}")
def get_cities_by_country(countryId: int, db: Session = Depends(get_db)):
    return db.query(City).filter(City.countryId == countryId).all()

@router.post("/city")
def create_city(payload: CityCreateRequest, db: Session = Depends(get_db)):
    city = City(name=payload.name, countryId=payload.countryId)
    db.add(city)
    db.commit()
    db.refresh(city)
    return city

@router.put("/city/{id}")
def update_city(id: int, payload: CityUpdateRequest, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    if payload.name is not None:
        city.name = payload.name
    if payload.countryId is not None:
        city.countryId = payload.countryId
    db.commit()
    db.refresh(city)
    return city

@router.delete("/city/{id}")
def delete_city(id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    db.delete(city)
    db.commit()
    return {"message": "City deleted successfully"}

# --- ZONES ---

@router.get("/zone")
def get_all_zones(search: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Zone)
    if search:
        q = q.filter(Zone.name.ilike(f"%{search}%"))
    zones = q.all()
    res = []
    for z in zones:
        res.append({
            "id": z.id,
            "name": z.name,
            "description": z.description,
            "weightLimit": z.weightLimit,
            "countries": [
                {
                    "id": c.id,
                    "name": c.name,
                    "boxWeightLimit": c.boxWeightLimit,
                    "isActive": c.isActive,
                    "zoneId": c.zoneId
                }
                for c in z.countries
            ],
            "createdAt": z.createdAt.isoformat() if z.createdAt else None,
            "updatedAt": z.updatedAt.isoformat() if z.updatedAt else None
        })
    return {"data": res}

@router.get("/zone/{id}")
def get_zone_by_id(id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {
        "id": zone.id,
        "name": zone.name,
        "description": zone.description,
        "weightLimit": zone.weightLimit,
        "countries": [
            {
                "id": c.id,
                "name": c.name,
                "boxWeightLimit": c.boxWeightLimit,
                "isActive": c.isActive,
                "zoneId": c.zoneId
            }
            for c in zone.countries
        ],
        "createdAt": zone.createdAt.isoformat() if zone.createdAt else None,
        "updatedAt": zone.updatedAt.isoformat() if zone.updatedAt else None
    }

@router.post("/zone")
def create_zone(payload: ZoneCreateRequest, db: Session = Depends(get_db)):
    zone = Zone(name=payload.name, description=payload.description, weightLimit=payload.weightLimit)
    db.add(zone)
    db.commit()
    db.refresh(zone)

    if payload.countryIds:
        for cid in payload.countryIds:
            c = db.query(Country).filter(Country.id == cid).first()
            if c:
                c.zoneId = zone.id
        db.commit()
        db.refresh(zone)

    return {
        "id": zone.id,
        "name": zone.name,
        "description": zone.description,
        "weightLimit": zone.weightLimit,
        "countries": [
            {
                "id": c.id,
                "name": c.name,
                "boxWeightLimit": c.boxWeightLimit,
                "isActive": c.isActive,
                "zoneId": c.zoneId
            }
            for c in zone.countries
        ]
    }

@router.put("/zone/{id}")
def update_zone(id: int, payload: ZoneUpdateRequest, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    if payload.name is not None:
        zone.name = payload.name
    if payload.description is not None:
        zone.description = payload.description
    if payload.weightLimit is not None:
        zone.weightLimit = payload.weightLimit

    if payload.countryIds is not None:
        # Clear existing associations
        db.query(Country).filter(Country.zoneId == zone.id).update({"zoneId": None}, synchronize_session=False)
        # Add new associations
        if payload.countryIds:
            for cid in payload.countryIds:
                c = db.query(Country).filter(Country.id == cid).first()
                if c:
                    c.zoneId = zone.id

    db.commit()
    db.refresh(zone)
    return {
        "id": zone.id,
        "name": zone.name,
        "description": zone.description,
        "weightLimit": zone.weightLimit,
        "countries": [
            {
                "id": c.id,
                "name": c.name,
                "boxWeightLimit": c.boxWeightLimit,
                "isActive": c.isActive,
                "zoneId": c.zoneId
            }
            for c in zone.countries
        ]
    }

@router.delete("/zone/{id}")
def delete_zone(id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    db.query(Country).filter(Country.zoneId == zone.id).update({"zoneId": None}, synchronize_session=False)
    db.delete(zone)
    db.commit()
    return {"message": "Zone deleted successfully"}


# --- ADDRESS VERIFICATION (Google Maps Platform Places API New + Real-time Suggestions) ---

@router.post("/verify-address")
def verify_address(payload: VerifyAddressRequest):
    """
    Intelligently verifies and standardizes addresses using Google Maps Platform (Places API New).
    Detects postal code typos, wrong state/prefecture designations (e.g. Tokyo vs Kanagawa),
    and redundant entries, returning exact suggestions and discrepancies.
    """
    addr1 = (payload.addressLine1 or "").strip()
    addr2 = (payload.addressLine2 or "").strip()
    city = (payload.city or "").strip()
    state = (payload.state or "").strip()
    postal = (payload.postalCode or "").strip()
    country = (payload.country or "").strip()

    if not addr1:
        return {
            "isVerified": False,
            "hasCorrections": False,
            "corrections": [],
            "status": "EMPTY_ADDRESS",
            "message": "Please enter an address to verify.",
            "provider": "None"
        }

    google_api_key = config.GOOGLE_MAPS_API_KEY
    if google_api_key:
        candidates = [
            f"{addr1}, {city}, {postal}, {country}",
            f"{addr1}, {city}, {country}",
            f"{addr1}, {country}",
            f"{addr1}"
        ]

        for cand in candidates:
            q_clean = ", ".join([p.strip() for p in cand.split(",") if p.strip()])
            if not q_clean:
                continue

            try:
                auto_url = "https://places.googleapis.com/v1/places:autocomplete"
                body = json.dumps({"input": q_clean}).encode("utf-8")
                req = urllib.request.Request(
                    auto_url,
                    data=body,
                    headers={
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": google_api_key,
                        "User-Agent": "NetPackLogistics-AddressVerifier/2.0"
                    }
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    auto_res = json.loads(resp.read().decode("utf-8"))

                suggestions = auto_res.get("suggestions", [])
                if suggestions:
                    best_pred = suggestions[0].get("placePrediction", {})
                    place_id = best_pred.get("placeId")
                    if not place_id:
                        continue

                    # Fetch Place Details in English for international standardization
                    det_url = (
                        f"https://places.googleapis.com/v1/places/{place_id}"
                        f"?fields=id,displayName,formattedAddress,addressComponents,location&languageCode=en"
                    )
                    det_req = urllib.request.Request(
                        det_url,
                        headers={
                            "X-Goog-Api-Key": google_api_key,
                            "X-Goog-FieldMask": "id,displayName,formattedAddress,addressComponents,location",
                            "User-Agent": "NetPackLogistics-AddressVerifier/2.0"
                        }
                    )
                    with urllib.request.urlopen(det_req, timeout=5) as det_resp:
                        det = json.loads(det_resp.read().decode("utf-8"))

                    comps = {}
                    for comp in det.get("addressComponents", []):
                        for t in comp.get("types", []):
                            comps[t] = comp.get("longText")

                    v_post = comps.get("postal_code")
                    v_state = comps.get("administrative_area_level_1")
                    v_city = comps.get("locality") or comps.get("postal_town")
                    v_country = comps.get("country")
                    v_ward = comps.get("sublocality_level_1") or comps.get("sublocality")
                    loc = det.get("location", {})
                    v_lat = loc.get("latitude")
                    v_lng = loc.get("longitude")
                    v_formatted = det.get("formattedAddress", q_clean)

                    corrections = []
                    # Check postal code mismatch or partial code
                    if v_post and postal and postal.lower().replace("-", "").strip() != v_post.lower().replace("-", "").strip():
                        corrections.append(f"Postal code corrected from '{postal}' to '{v_post}'")
                    elif v_post and not postal:
                        corrections.append(f"Postal code auto-detected: '{v_post}'")

                    # Check state / prefecture mismatch
                    if v_state and state and state.lower().strip() != v_state.lower().strip():
                        corrections.append(
                            f"State / Prefecture corrected from '{state}' to '{v_state}' ({v_city or 'Area'} is in {v_state}, not {state})"
                        )
                    elif v_state and not state:
                        corrections.append(f"State / Prefecture auto-detected: '{v_state}'")

                    # Check city
                    if v_city and city and city.lower().strip() != v_city.lower().strip():
                        corrections.append(f"City standardized from '{city}' to '{v_city}'")

                    # Clean redundant city/state text from addressLine2
                    clean_addr2 = addr2
                    if clean_addr2 and (v_city or v_state):
                        parts = [p.strip() for p in clean_addr2.split(",") if p.strip()]
                        remove_tokens = set([
                            t.lower() for t in [
                                v_city or "",
                                v_state or "",
                                state or "",
                                f"{(v_city or '').lower()} city",
                                f"{(state or '').lower()} city"
                            ] if t
                        ])
                        filtered = [p for p in parts if p.lower() not in remove_tokens]
                        candidate_addr2 = ", ".join(filtered) if filtered else (v_ward or "")
                        if candidate_addr2 != addr2:
                            clean_addr2 = candidate_addr2
                            corrections.append("Address Line 2: removed redundant city/state entries")

                    has_corrections = len(corrections) > 0

                    return {
                        "isVerified": True,
                        "hasCorrections": has_corrections,
                        "corrections": corrections,
                        "status": "OK",
                        "formattedAddress": v_formatted,
                        "lat": v_lat,
                        "lng": v_lng,
                        "postalCode": v_post or postal,
                        "city": v_city or city,
                        "state": v_state or state,
                        "country": v_country or country,
                        "suggestion": {
                            "addressLine1": addr1,
                            "addressLine2": clean_addr2,
                            "city": v_city or city,
                            "state": v_state or state,
                            "postalCode": v_post or postal,
                            "country": v_country or country
                        },
                        "provider": "Google Maps Platform",
                        "message": (
                            "Address verified. Suggested corrections found."
                            if has_corrections
                            else "Address successfully verified via Google Maps."
                        )
                    }

            except Exception as ge:
                print(f"[Location Warning] Places API candidate check error: {ge}")

    # Fallback to Global OpenStreetMap Geocoding
    try:
        q_osm = ", ".join([p for p in [addr1, city, postal, country] if p])
        osm_url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(q_osm)}&format=json&addressdetails=1&limit=1"
        osm_req = urllib.request.Request(
            osm_url,
            headers={"User-Agent": "NetPackLogistics-GeocodingFallback/2.0 (info@netpacklogistic.com)"}
        )
        with urllib.request.urlopen(osm_req, timeout=5) as osm_resp:
            osm_res = json.loads(osm_resp.read().decode("utf-8"))

        if osm_res and len(osm_res) > 0:
            best_osm = osm_res[0]
            addr_details = best_osm.get("address", {})
            osm_postal = addr_details.get("postcode")
            osm_city = (
                addr_details.get("city")
                or addr_details.get("town")
                or addr_details.get("municipality")
                or addr_details.get("village")
            )
            osm_state = addr_details.get("state")
            osm_country = addr_details.get("country")
            osm_lat = float(best_osm.get("lat")) if best_osm.get("lat") else None
            osm_lng = float(best_osm.get("lon")) if best_osm.get("lon") else None

            corrections = []
            if osm_postal and postal and postal.lower().replace("-", "") != osm_postal.lower().replace("-", ""):
                corrections.append(f"Postal code corrected from '{postal}' to '{osm_postal}'")
            if osm_state and state and state.lower() != osm_state.lower():
                corrections.append(f"State corrected from '{state}' to '{osm_state}'")

            return {
                "isVerified": True,
                "hasCorrections": len(corrections) > 0,
                "corrections": corrections,
                "status": "OK",
                "formattedAddress": best_osm.get("display_name", q_osm),
                "lat": osm_lat,
                "lng": osm_lng,
                "postalCode": osm_postal or postal,
                "city": osm_city or city,
                "state": osm_state or state,
                "country": osm_country or country,
                "suggestion": {
                    "addressLine1": addr1,
                    "addressLine2": addr2,
                    "city": osm_city or city,
                    "state": osm_state or state,
                    "postalCode": osm_postal or postal,
                    "country": osm_country or country
                },
                "provider": "Global Address Database",
                "message": "Address verified via Global Geocoding service."
            }
    except Exception as osm_e:
        print(f"[Location Warning] Global Geocoding fallback: {osm_e}")

    # If could not find place in any database
    return {
        "isVerified": False,
        "hasCorrections": False,
        "corrections": [],
        "status": "NOT_FOUND",
        "formattedAddress": addr1,
        "postalCode": postal,
        "city": city,
        "state": state,
        "country": country,
        "provider": "Google Maps Platform",
        "message": "Could not find a matching location. Please check the address for spelling errors."
    }

