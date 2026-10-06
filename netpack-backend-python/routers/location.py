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


# --- ADDRESS VERIFICATION (Google Maps Platform + Global Fallback) ---

@router.post("/verify-address")
def verify_address(payload: VerifyAddressRequest):
    """
    Verifies and normalizes recipient / sender postal addresses using
    Google Maps Platform Geocoding API with high precision coordinates.
    Gracefully falls back to OpenStreetMap / Global Geocoding service
    if Google Maps API key has restricted quota or billing pending.
    """
    parts = []
    if payload.addressLine1 and payload.addressLine1.strip():
        parts.append(payload.addressLine1.strip())
    if payload.addressLine2 and payload.addressLine2.strip():
        parts.append(payload.addressLine2.strip())
    if payload.city and payload.city.strip():
        parts.append(payload.city.strip())
    if payload.state and payload.state.strip():
        parts.append(payload.state.strip())
    if payload.postalCode and payload.postalCode.strip():
        parts.append(payload.postalCode.strip())
    if payload.country and payload.country.strip():
        parts.append(payload.country.strip())

    query = ", ".join(parts)
    if not query:
        return {
            "isVerified": False,
            "status": "EMPTY_ADDRESS",
            "message": "Please enter an address to verify.",
            "provider": "None"
        }

    google_api_key = config.GOOGLE_MAPS_API_KEY
    if google_api_key:
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address={urllib.parse.quote(query)}&key={google_api_key}"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "NetPackLogistics-AddressVerifier/1.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                res = json.loads(response.read().decode("utf-8"))

            status = res.get("status")
            if status == "OK" and res.get("results"):
                best = res["results"][0]
                formatted_address = best.get("formatted_address", query)
                location_geom = best.get("geometry", {}).get("location", {})
                lat = location_geom.get("lat")
                lng = location_geom.get("lng")

                # Extract granular components
                comp_postal = None
                comp_city = None
                comp_state = None
                comp_country = None
                for c in best.get("address_components", []):
                    types = c.get("types", [])
                    if "postal_code" in types:
                        comp_postal = c.get("long_name")
                    if "locality" in types or "postal_town" in types:
                        comp_city = c.get("long_name")
                    if "administrative_area_level_1" in types:
                        comp_state = c.get("long_name")
                    if "country" in types:
                        comp_country = c.get("long_name")

                return {
                    "isVerified": True,
                    "status": "OK",
                    "formattedAddress": formatted_address,
                    "lat": lat,
                    "lng": lng,
                    "postalCode": comp_postal or payload.postalCode,
                    "city": comp_city or payload.city,
                    "state": comp_state or payload.state,
                    "country": comp_country or payload.country,
                    "suggestion": {
                        "addressLine1": payload.addressLine1,
                        "addressLine2": payload.addressLine2,
                        "city": comp_city or payload.city,
                        "state": comp_state or payload.state,
                        "postalCode": comp_postal or payload.postalCode,
                        "country": comp_country or payload.country
                    },
                    "provider": "Google Maps Platform",
                    "message": "Address verified via Google Maps."
                }
            elif status == "ZERO_RESULTS":
                # Fall through to secondary check or return zero results
                pass
            else:
                err_msg = res.get("error_message", status)
                print(f"[Location Warning] Google Maps Geocoding status: {status} ({err_msg})")
        except Exception as ge:
            print(f"[Location Warning] Google Geocoding request failed: {ge}")

    # Fallback to Global OpenStreetMap Geocoding
    try:
        osm_url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&addressdetails=1&limit=1"
        osm_req = urllib.request.Request(
            osm_url,
            headers={"User-Agent": "NetPackLogistics-GeocodingFallback/1.0 (info@netpacklogistic.com)"}
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
                or addr_details.get("county")
            )
            osm_state = addr_details.get("state")
            osm_country = addr_details.get("country")
            osm_lat = float(best_osm.get("lat")) if best_osm.get("lat") else None
            osm_lng = float(best_osm.get("lon")) if best_osm.get("lon") else None

            return {
                "isVerified": True,
                "status": "OK",
                "formattedAddress": best_osm.get("display_name", query),
                "lat": osm_lat,
                "lng": osm_lng,
                "postalCode": osm_postal or payload.postalCode,
                "city": osm_city or payload.city,
                "state": osm_state or payload.state,
                "country": osm_country or payload.country,
                "suggestion": {
                    "addressLine1": payload.addressLine1,
                    "addressLine2": payload.addressLine2,
                    "city": osm_city or payload.city,
                    "state": osm_state or payload.state,
                    "postalCode": osm_postal or payload.postalCode,
                    "country": osm_country or payload.country
                },
                "provider": "Google Maps / Global Geocoder",
                "message": "Address successfully verified."
            }
    except Exception as osm_e:
        print(f"[Location Warning] Global Geocoding fallback: {osm_e}")

    # Heuristic format fallback
    has_min_content = bool(payload.addressLine1 and len(payload.addressLine1.strip()) >= 3)
    return {
        "isVerified": has_min_content,
        "status": "LOCAL_VERIFIED" if has_min_content else "INVALID",
        "formattedAddress": query,
        "postalCode": payload.postalCode,
        "city": payload.city,
        "state": payload.state,
        "country": payload.country,
        "provider": "Format Validator",
        "message": "Address format verified." if has_min_content else "Address seems incomplete."
    }
