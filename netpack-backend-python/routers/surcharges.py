import csv
import io
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db, Base, engine
from models.location import SurchargeRule

# Ensure table exists in database
Base.metadata.create_all(bind=engine, tables=[SurchargeRule.__table__])

router = APIRouter(prefix="/api/surcharges", tags=["Surcharges"])


class SurchargeCheckRequest(BaseModel):
    postalCode: Optional[str] = None
    city: Optional[str] = None
    service: Optional[str] = None
    country: Optional[str] = None


class SurchargeRuleCreate(BaseModel):
    zipCode: Optional[str] = None
    service: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = "USD"
    description: Optional[str] = None


@router.get("")
@router.get("/")
def get_surcharge_rules(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db)
):
    query = db.query(SurchargeRule)
    if search and search.strip():
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SurchargeRule.zipCode.ilike(s),
                SurchargeRule.city.ilike(s),
                SurchargeRule.service.ilike(s),
                SurchargeRule.country.ilike(s)
            )
        )
    total = query.count()
    rules = query.order_by(SurchargeRule.id.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": r.id,
                "zipCode": r.zipCode,
                "service": r.service,
                "city": r.city,
                "country": r.country,
                "amount": r.amount,
                "currency": r.currency,
                "description": r.description,
                "isActive": r.isActive,
                "createdAt": r.createdAt.isoformat() if r.createdAt else None
            }
            for r in rules
        ]
    }


@router.post("/upload")
async def upload_surcharges_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts CSV or Excel (.xlsx/.xls) file containing:
    'Zip code', 'Service', 'City' (case-insensitive headers).
    """
    filename = (file.filename or "").lower()
    content = await file.read()

    rows_data: List[Dict[str, Any]] = []

    if filename.endswith(".csv") or filename.endswith(".txt"):
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = content.decode("latin-1")

        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            # Normalize keys to lowercase stripped
            norm = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
            zip_val = norm.get("zip code") or norm.get("zipcode") or norm.get("zip") or norm.get("postal code") or norm.get("postcode")
            service_val = norm.get("service") or norm.get("service name") or norm.get("carrier")
            city_val = norm.get("city") or norm.get("location") or norm.get("town")
            country_val = norm.get("country") or norm.get("country code")

            if zip_val or city_val:
                rows_data.append({
                    "zipCode": zip_val or None,
                    "service": service_val or "Standard Express",
                    "city": city_val or None,
                    "country": country_val or None
                })
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            sheet = wb.active
            headers = []
            for cell in sheet[1]:
                headers.append(str(cell.value or "").strip().lower())

            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not any(row):
                    continue
                row_dict = dict(zip(headers, row))
                zip_val = str(row_dict.get("zip code") or row_dict.get("zipcode") or row_dict.get("zip") or row_dict.get("postal code") or row_dict.get("postcode") or "").strip()
                service_val = str(row_dict.get("service") or row_dict.get("service name") or row_dict.get("carrier") or "").strip()
                city_val = str(row_dict.get("city") or row_dict.get("location") or row_dict.get("town") or "").strip()
                country_val = str(row_dict.get("country") or "").strip()

                if zip_val or city_val:
                    rows_data.append({
                        "zipCode": zip_val or None,
                        "service": service_val or "Standard Express",
                        "city": city_val or None,
                        "country": country_val or None
                    })
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse Excel file: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a .csv or .xlsx file.")

    if not rows_data:
        raise HTTPException(status_code=400, detail="No valid surcharge rows found in file. Ensure headers include 'Zip code', 'Service', 'City'.")

    inserted_count = 0
    now = datetime.utcnow()
    for item in rows_data:
        rule = SurchargeRule(
            zipCode=item["zipCode"],
            service=item["service"],
            city=item["city"],
            country=item.get("country"),
            isActive=True,
            createdAt=now,
            updatedAt=now
        )
        db.add(rule)
        inserted_count += 1

    db.commit()
    return {
        "message": f"Successfully uploaded and saved {inserted_count} surcharge rules.",
        "count": inserted_count
    }


@router.post("/check")
def check_surcharge(
    payload: SurchargeCheckRequest,
    db: Session = Depends(get_db)
):
    """
    Checks if given postal code or city matches any uploaded surcharge rules.
    Returns:
    { "hasSurcharge": true, "message": "(... Surcharge applied with ... service)", "service": "...", ... }
    """
    zip_code = (payload.postalCode or "").strip()
    city = (payload.city or "").strip()
    service = (payload.service or "").strip()

    if not zip_code and not city:
        return {"hasSurcharge": False}

    query = db.query(SurchargeRule).filter(SurchargeRule.isActive == True)

    match = None
    # 1. Exact or prefix match on zip code
    if zip_code:
        match = query.filter(
            or_(
                SurchargeRule.zipCode.ilike(zip_code),
                SurchargeRule.zipCode.ilike(f"{zip_code}%"),
                SurchargeRule.zipCode == zip_code
            )
        ).first()

    # 2. Match on city if not found by zip code
    if not match and city:
        match = query.filter(SurchargeRule.city.ilike(city)).first()

    if match:
        svc_name = match.service or service or "Express"
        loc_str = match.city or match.zipCode or "Destination"
        msg = f"({loc_str} Surcharge applied with {svc_name} service)"
        return {
            "hasSurcharge": True,
            "message": msg,
            "service": svc_name,
            "city": match.city,
            "zipCode": match.zipCode,
            "amount": match.amount,
            "ruleId": match.id
        }

    return {"hasSurcharge": False}


@router.delete("/{id}")
def delete_surcharge_rule(id: int, db: Session = Depends(get_db)):
    rule = db.query(SurchargeRule).filter(SurchargeRule.id == id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Surcharge rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Surcharge rule deleted successfully"}


@router.delete("/clear-all")
def clear_all_surcharges(db: Session = Depends(get_db)):
    cnt = db.query(SurchargeRule).delete()
    db.commit()
    return {"message": f"Cleared {cnt} surcharge rules"}
