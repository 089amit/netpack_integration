from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Union, Any
import openpyxl
from database import get_db
from models.rate import Rate, TIACharge, CustomCharge, PackingCharge
from models.location import Country, Zone
from schemas.rate import (
    RateCalculatorRequest, SurchargeUpdateRequest,
    RateCreateRequest, RateUpdateRequest
)
from services.rate_service import compute_shipping_rate

router = APIRouter(prefix="/api/rate", tags=["Rates"])

@router.post("/rate-calculator")
def calculate_rate(payload: RateCalculatorRequest, db: Session = Depends(get_db)):
    try:
        result = compute_shipping_rate(db, payload.weight, payload.destination)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rate calculation error: {str(e)}")

@router.get("/getTIACharge")
def get_tia_charge(db: Session = Depends(get_db)):
    r = db.query(TIACharge).first()
    return {"rate": float(r.rate or 0) if r else 0.0}

@router.post("/updateTIACharge")
def update_tia_charge(payload: SurchargeUpdateRequest, db: Session = Depends(get_db)):
    r = db.query(TIACharge).first()
    if not r:
        r = TIACharge(rate=payload.rate)
        db.add(r)
    else:
        r.rate = payload.rate
    db.commit()
    return {"message": "TIA charge updated", "rate": payload.rate}

@router.get("/getCustomCharge")
def get_custom_charge(db: Session = Depends(get_db)):
    r = db.query(CustomCharge).first()
    return {"rate": float(r.rate or 0) if r else 0.0}

@router.post("/updateCustomCharge")
def update_custom_charge(payload: SurchargeUpdateRequest, db: Session = Depends(get_db)):
    r = db.query(CustomCharge).first()
    if not r:
        r = CustomCharge(rate=payload.rate)
        db.add(r)
    else:
        r.rate = payload.rate
    db.commit()
    return {"message": "Custom charge updated", "rate": payload.rate}

@router.get("/getPackingRate")
def get_packing_rate(db: Session = Depends(get_db)):
    r = db.query(PackingCharge).first()
    return {"rate": float(r.rate or 0) if r else 0.0}

@router.post("/updatePackingCharge")
def update_packing_charge(payload: SurchargeUpdateRequest, db: Session = Depends(get_db)):
    r = db.query(PackingCharge).first()
    if not r:
        r = PackingCharge(rate=payload.rate)
        db.add(r)
    else:
        r.rate = payload.rate
    db.commit()
    return {"message": "Packing charge updated", "rate": payload.rate}

@router.get("/countries/{countryName}")
def get_rates_by_country(countryName: str, db: Session = Depends(get_db)):
    c = db.query(Country).filter(Country.name == countryName).first()
    if not c:
        c = db.query(Country).filter(Country.name.ilike(f"%{countryName}%")).first()
    if not c:
        return {"rates": []}
    rates = db.query(Rate).filter(Rate.countryId == c.id).all()
    res = [
        {
            "id": r.id,
            "weightFrom": r.weightFrom,
            "weightTo": r.weightTo,
            "rate": r.rate,
            "isPerKg": r.isPerKg,
            "countryId": r.countryId,
            "countryName": c.name
        }
        for r in rates
    ]
    return {"rates": res}

@router.get("/zone/{zoneId}")
def get_rates_by_zone(zoneId: int, db: Session = Depends(get_db)):
    z = db.query(Zone).filter(Zone.id == zoneId).first()
    rates = db.query(Rate).filter(Rate.zoneId == zoneId).all()
    res = [
        {
            "id": r.id,
            "weightFrom": r.weightFrom,
            "weightTo": r.weightTo,
            "rate": r.rate,
            "isPerKg": r.isPerKg,
            "zoneId": r.zoneId,
            "zoneName": z.name if z else ""
        }
        for r in rates
    ]
    return {"rates": res}

@router.post("/add-rate")
def add_rate(payload: Union[RateCreateRequest, List[RateCreateRequest]], db: Session = Depends(get_db)):
    items = payload if isinstance(payload, list) else [payload]
    last_rate = None
    for item in items:
        country_id = item.countryId
        zone_id = item.zoneId

        if not country_id and item.countryName:
            c = db.query(Country).filter(Country.name == item.countryName).first()
            if not c:
                c = db.query(Country).filter(Country.name.ilike(f"%{item.countryName}%")).first()
            if c:
                country_id = c.id

        if not zone_id and item.zoneName:
            z = db.query(Zone).filter(Zone.name == item.zoneName).first()
            if not z:
                z = db.query(Zone).filter(Zone.name.ilike(f"%{item.zoneName}%")).first()
            if z:
                zone_id = z.id

        rate = Rate(
            weightFrom=item.weightFrom,
            weightTo=item.weightTo,
            rate=item.rate,
            isPerKg=item.isPerKg,
            countryId=country_id,
            zoneId=zone_id,
            serviceId=item.serviceId
        )
        db.add(rate)
        db.commit()
        db.refresh(rate)
        last_rate = rate

    return {
        "message": "Rate added successfully",
        "id": last_rate.id if last_rate else None,
        "rate": {
            "id": last_rate.id,
            "weightFrom": last_rate.weightFrom,
            "weightTo": last_rate.weightTo,
            "rate": last_rate.rate,
            "isPerKg": last_rate.isPerKg
        } if last_rate else None
    }

@router.put("/update-rate/{id}")
def update_rate(id: int, payload: Union[RateUpdateRequest, List[RateUpdateRequest]], db: Session = Depends(get_db)):
    item = payload[0] if isinstance(payload, list) and len(payload) > 0 else payload
    if isinstance(item, list):
        item = item[0] if len(item) > 0 else RateUpdateRequest()

    r = db.query(Rate).filter(Rate.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rate not found")

    if item.weightFrom is not None:
        r.weightFrom = item.weightFrom
    if item.weightTo is not None:
        r.weightTo = item.weightTo
    if item.rate is not None:
        r.rate = item.rate
    if item.isPerKg is not None:
        r.isPerKg = item.isPerKg
    if item.countryId is not None:
        r.countryId = item.countryId
    if item.zoneId is not None:
        r.zoneId = item.zoneId
    if item.serviceId is not None:
        r.serviceId = item.serviceId

    db.commit()
    return {"message": "Rate updated successfully", "id": r.id}

@router.delete("/deleterate/{id}")
def delete_rate(id: int, db: Session = Depends(get_db)):
    r = db.query(Rate).filter(Rate.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rate not found")
    db.delete(r)
    db.commit()
    return {"message": "Rate deleted successfully"}

@router.post("/import-excel")
async def import_excel_rates(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        import io
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet = wb.active

        # Process simple rate sheet (Weight From, Weight To, Rate, Country/Zone)
        imported_count = 0
        rows = list(sheet.iter_rows(values_only=True))
        if not rows or len(rows) < 2:
            return {"message": "Empty or invalid spreadsheet"}

        for row in rows[1:]:
            if not row or len(row) < 3 or row[0] is None:
                continue
            try:
                w_from = float(row[0])
                w_to = float(row[1])
                rate_val = float(row[2])
                c_name = str(row[3]).strip() if len(row) > 3 and row[3] else None
                
                c_id = None
                if c_name:
                    c = db.query(Country).filter(Country.name == c_name).first()
                    if c:
                        c_id = c.id

                r = Rate(
                    weightFrom=w_from,
                    weightTo=w_to,
                    rate=rate_val,
                    isPerKg=False,
                    countryId=c_id
                )
                db.add(r)
                imported_count += 1
            except Exception:
                continue

        db.commit()
        return {"message": f"Successfully imported {imported_count} rate slabs"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel import error: {str(e)}")
