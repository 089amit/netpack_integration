from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.location import Country, City, Zone, AreaSurcharge
from schemas.location import (
    CountryCreateRequest, CountryUpdateRequest,
    CityCreateRequest, CityUpdateRequest,
    ZoneCreateRequest, ZoneUpdateRequest
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
