import csv
import io
import re
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, text

from database import get_db, Base, engine
from models.location import SurchargeRule

# Ensure table and surchargeType column exist in database with exact quotes
Base.metadata.create_all(bind=engine, tables=[SurchargeRule.__table__])
try:
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE surcharge_rules ADD COLUMN IF NOT EXISTS "surchargeType" VARCHAR(50) DEFAULT \'RES\''))
        conn.commit()
except Exception:
    pass

router = APIRouter(prefix="/api/surcharges", tags=["Surcharges"])


class SurchargeCheckRequest(BaseModel):
    postalCode: Optional[str] = None
    city: Optional[str] = None
    service: Optional[str] = None
    country: Optional[str] = None
    countryName: Optional[str] = None
    addressLine1: Optional[str] = None
    state: Optional[str] = None


class SurchargeRuleCreate(BaseModel):
    zipCode: Optional[str] = None
    service: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = "USD"
    surchargeType: Optional[str] = "RES"
    description: Optional[str] = None


@router.post("")
@router.post("/")
def create_surcharge_rule(
    payload: SurchargeRuleCreate,
    db: Session = Depends(get_db)
):
    rule = SurchargeRule(
        zipCode=payload.zipCode.strip() if payload.zipCode else None,
        service=payload.service.strip() if payload.service else "Express",
        city=payload.city.strip() if payload.city else None,
        country=payload.country.strip() if payload.country else None,
        amount=payload.amount,
        currency=(payload.currency or "USD").upper().strip(),
        surchargeType=(payload.surchargeType or "RES").upper().strip(),
        description=payload.description.strip() if payload.description else None,
        isActive=True,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    try:
        db.add(rule)
        db.commit()
        db.refresh(rule)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create surcharge rule: {str(e)}")

    return {
        "message": "Surcharge rule created successfully",
        "data": {
            "id": rule.id,
            "zipCode": rule.zipCode,
            "service": rule.service,
            "city": rule.city,
            "country": rule.country,
            "amount": rule.amount,
            "currency": rule.currency,
            "surchargeType": getattr(rule, "surchargeType", "RES"),
            "description": rule.description,
            "isActive": rule.isActive,
            "createdAt": rule.createdAt.isoformat() if rule.createdAt else None
        }
    }


@router.get("/sample")
def download_sample_csv():
    from fastapi.responses import Response
    sample_content = (
        "Code,Service,City,Country,Rate,Currency,Type\n"
        "800,Aramex,Darwin,Australia,2.56,USD,RES\n"
        "249,UPS,Scotland,UK,100,EUR,EAS\n"
        "90210,DHL,Beverly Hills,United States,25.00,USD,RES\n"
        "EC1A 1BB,FedEx,London,United Kingdom,30.00,GBP,EAS\n"
    )
    return Response(
        content=sample_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=surcharge_sample_template.csv"}
    )


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
                SurchargeRule.country.ilike(s),
                SurchargeRule.surchargeType.ilike(s)
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
                "surchargeType": getattr(r, "surchargeType", "RES") or "RES",
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
    Accepts CSV or Excel (.xlsx/.xls) file containing columns:
    'Code'/'Zip code', 'Service', 'City', 'Country', 'Rate'/'Amount', 'Currency', 'Type' (RES/EAS).
    """
    filename = (file.filename or "").lower()
    content = await file.read()

    rows_data: List[Dict[str, Any]] = []

    def _parse_row(norm: Dict[str, Any]):
        zip_val = (
            norm.get("code") or norm.get("zip code") or norm.get("zipcode") or norm.get("zip") or
            norm.get("postal code") or norm.get("postcode") or norm.get("postal_code") or
            norm.get("pincode") or norm.get("pin code")
        )
        service_val = norm.get("service") or norm.get("service name") or norm.get("carrier") or norm.get("network") or "Standard Express"
        city_val = norm.get("city") or norm.get("location") or norm.get("town") or norm.get("destination") or norm.get("area")
        country_val = norm.get("country") or norm.get("country code") or norm.get("country name") or norm.get("dest country")
        raw_amt = norm.get("rate") or norm.get("amount") or norm.get("charge") or norm.get("fee") or norm.get("cost") or norm.get("price") or norm.get("surcharge")
        currency_val = (norm.get("currency") or norm.get("curr") or "USD").upper().strip()
        type_val = (norm.get("type") or norm.get("surchargetype") or norm.get("surcharge_type") or norm.get("category") or "RES").upper().strip()
        
        parsed_amt = None
        if raw_amt is not None and str(raw_amt).strip() != "":
            clean_str = re.sub(r"[^\d.]", "", str(raw_amt))
            if clean_str:
                try:
                    parsed_amt = float(clean_str)
                except (ValueError, TypeError):
                    parsed_amt = None

        if zip_val or city_val or country_val:
            rows_data.append({
                "zipCode": str(zip_val).strip() if zip_val else None,
                "service": str(service_val).strip(),
                "city": str(city_val).strip() if city_val else None,
                "country": str(country_val).strip() if country_val else None,
                "amount": parsed_amt,
                "currency": currency_val,
                "surchargeType": type_val
            })

    if filename.endswith(".csv") or filename.endswith(".txt"):
        try:
            text_data = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            text_data = content.decode("latin-1")

        # Auto-detect delimiter
        sample_chunk = text_data[:4096]
        delimiter = ','
        if ';' in sample_chunk and sample_chunk.count(';') > sample_chunk.count(','):
            delimiter = ';'
        elif '\t' in sample_chunk and sample_chunk.count('\t') > sample_chunk.count(','):
            delimiter = '\t'

        reader = csv.DictReader(io.StringIO(text_data), delimiter=delimiter)
        for row in reader:
            norm = {str(k).strip().lower(): (str(v).strip() if v else "") for k, v in row.items() if k}
            _parse_row(norm)
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
                norm = {str(k).strip().lower(): (str(v).strip() if v is not None else "") for k, v in row_dict.items() if k}
                _parse_row(norm)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse Excel file: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a .csv or .xlsx file.")

    if not rows_data:
        raise HTTPException(status_code=400, detail="No valid surcharge rows found in file. Supported headers: Code, Service, City, Country, Rate, Currency, Type.")

    inserted_count = 0
    now = datetime.utcnow()
    for item in rows_data:
        rule = SurchargeRule(
            zipCode=item["zipCode"],
            service=item["service"],
            city=item["city"],
            country=item.get("country"),
            amount=item.get("amount"),
            currency=item.get("currency") or "USD",
            surchargeType=item.get("surchargeType") or "RES",
            isActive=True,
            createdAt=now,
            updatedAt=now
        )
        db.add(rule)
        inserted_count += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error saving surcharge rules: {str(e)}")

    return {
        "message": f"Successfully uploaded and saved {inserted_count} surcharge rules.",
        "count": inserted_count
    }


def normalize_country(c: Optional[str]) -> List[str]:
    if not c:
        return []
    c_clean = c.strip().upper()
    COUNTRY_MAP = {
        "AU": ["AU", "AUS", "AUSTRALIA"],
        "AUS": ["AU", "AUS", "AUSTRALIA"],
        "AUSTRALIA": ["AU", "AUS", "AUSTRALIA"],
        "US": ["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA"],
        "USA": ["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA"],
        "UNITED STATES": ["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA"],
        "UNITED STATES OF AMERICA": ["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA"],
        "GB": ["GB", "UK", "UNITED KINGDOM", "GREAT BRITAIN", "ENGLAND", "SCOTLAND", "WALES"],
        "UK": ["GB", "UK", "UNITED KINGDOM", "GREAT BRITAIN", "ENGLAND", "SCOTLAND", "WALES"],
        "UNITED KINGDOM": ["GB", "UK", "UNITED KINGDOM", "GREAT BRITAIN", "ENGLAND", "SCOTLAND", "WALES"],
        "CA": ["CA", "CAN", "CANADA"],
        "CAN": ["CA", "CAN", "CANADA"],
        "CANADA": ["CA", "CAN", "CANADA"],
        "IN": ["IN", "IND", "INDIA"],
        "IND": ["IN", "IND", "INDIA"],
        "INDIA": ["IN", "IND", "INDIA"],
        "NP": ["NP", "NPL", "NEPAL"],
        "NPL": ["NP", "NPL", "NEPAL"],
        "NEPAL": ["NP", "NPL", "NEPAL"],
        "NZ": ["NZ", "NZL", "NEW ZEALAND"],
        "NZL": ["NZ", "NZL", "NEW ZEALAND"],
        "NEW ZEALAND": ["NZ", "NZL", "NEW ZEALAND"],
        "JP": ["JP", "JPN", "JAPAN"],
        "JPN": ["JP", "JPN", "JAPAN"],
        "JAPAN": ["JP", "JPN", "JAPAN"],
    }
    return COUNTRY_MAP.get(c_clean, [c_clean])


def perform_smart_surcharge_check(
    db: Session,
    postal_code: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    address_line: Optional[str] = None,
    state: Optional[str] = None,
    service: Optional[str] = None
) -> Dict[str, Any]:
    zip_code = (postal_code or "").strip()
    city_str = (city or "").strip()
    country_str = (country or "").strip()
    addr_str = (address_line or "").strip()
    state_str = (state or "").strip()
    svc_str = (service or "").strip()

    if not zip_code and not city_str and not addr_str:
        return {"hasSurcharge": False, "success": False}

    active_rules = db.query(SurchargeRule).filter(SurchargeRule.isActive == True).all()
    if not active_rules:
        return {"hasSurcharge": False, "success": False}

    country_aliases = normalize_country(country_str)

    candidate_rules = []
    fallback_rules = []
    for r in active_rules:
        r_country = (r.country or "").strip().upper()
        if not r_country:
            fallback_rules.append(r)
        elif country_aliases and any(alias in r_country or r_country in alias for alias in country_aliases):
            candidate_rules.append(r)
        elif not country_aliases:
            candidate_rules.append(r)

    rules_to_search = candidate_rules + fallback_rules if candidate_rules else active_rules

    # Generate postal code comparison variants
    zip_variants = set()
    zip_int = None
    if zip_code:
        zip_clean = re.sub(r'[\s\-]', '', zip_code).upper()
        zip_variants.add(zip_code.upper())
        zip_variants.add(zip_clean)
        digit_match = re.search(r'\d+', zip_code)
        if digit_match:
            try:
                zip_int = int(digit_match.group(0))
                zip_variants.add(str(zip_int))
                zip_variants.add(f"{zip_int:03d}")
                zip_variants.add(f"{zip_int:04d}")
                zip_variants.add(f"{zip_int:05d}")
            except Exception:
                pass

    matched_rule = None

    # Step 1: Match by postal code
    if zip_code:
        for r in rules_to_search:
            r_zip = (r.zipCode or "").strip().upper()
            if not r_zip:
                continue

            r_clean = re.sub(r'[\s\-]', '', r_zip)
            if r_zip in zip_variants or r_clean in zip_variants:
                matched_rule = r
                break

            r_digit_match = re.search(r'\d+', r_zip)
            if r_digit_match and zip_int is not None:
                try:
                    r_int = int(r_digit_match.group(0))
                    if r_int == zip_int:
                        matched_rule = r
                        break
                except Exception:
                    pass

            if '-' in r_zip and zip_int is not None:
                parts = r_zip.split('-')
                if len(parts) == 2:
                    p1_digits = re.search(r'\d+', parts[0])
                    p2_digits = re.search(r'\d+', parts[1])
                    if p1_digits and p2_digits:
                        try:
                            low = int(p1_digits.group(0))
                            high = int(p2_digits.group(0))
                            if low <= zip_int <= high:
                                matched_rule = r
                                break
                        except Exception:
                            pass

            if len(r_clean) >= 3 and (zip_clean.startswith(r_clean) or r_clean.startswith(zip_clean)):
                matched_rule = r
                break

    # Step 2: Match by city or location if not matched by postal code
    if not matched_rule and (city_str or addr_str or state_str):
        combined_text = f"{city_str} {addr_str} {state_str}".lower()
        for r in rules_to_search:
            r_city = (r.city or "").strip().lower()
            if not r_city:
                continue

            if r_city in combined_text or r_city in city_str.lower():
                matched_rule = r
                break

            if city_str.lower() in r_city and len(city_str) >= 3:
                matched_rule = r
                break

            r_words = set(re.findall(r'\b\w+\b', r_city))
            c_words = set(re.findall(r'\b\w+\b', combined_text))
            meaningful_r = {w for w in r_words if len(w) > 3 and w not in {'city', 'near', 'town', 'dist', 'zone'}}
            if meaningful_r and meaningful_r.issubset(c_words):
                matched_rule = r
                break

    if matched_rule:
        svc_name = matched_rule.service or svc_str or "Express"
        rate_val = matched_rule.amount
        curr_val = matched_rule.currency or "USD"
        type_val = getattr(matched_rule, "surchargeType", None) or "RES"
        
        type_desc = "Residential Surcharge (RES)" if type_val == "RES" else (
            "Extended Area Surcharge (EAS)" if type_val == "EAS" else f"{type_val} Surcharge"
        )

        if rate_val is not None:
            formatted_msg = f"{rate_val} {curr_val} per kg will be applied as {type_val} ({type_desc}) for this address while being delivered by {svc_name}"
        else:
            loc_str = matched_rule.city or matched_rule.zipCode or city_str or "this destination"
            formatted_msg = f"Surcharge will be applied as {type_val} ({type_desc}) for this address ({loc_str}) while being delivered by {svc_name}"

        return {
            "hasSurcharge": True,
            "success": True,
            "surchargeType": type_val,
            "surchargeMessage": formatted_msg,
            "formattedWarning": formatted_msg,
            "service": svc_name,
            "city": matched_rule.city,
            "zipCode": matched_rule.zipCode,
            "country": matched_rule.country,
            "amount": rate_val,
            "rate": rate_val,
            "currency": curr_val,
            "type": type_val,
            "ruleId": matched_rule.id
        }

    # Step 3: Check legacy AreaSurcharge table if present
    try:
        from models.rate import AreaSurcharge
        query = db.query(AreaSurcharge)
        if country_str:
            query = query.filter(
                or_(
                    AreaSurcharge.countryCode.ilike(country_str),
                    AreaSurcharge.countryCode.in_(country_aliases)
                )
            )
        
        legacy_surcharge = None
        if zip_code:
            legacy_surcharge = query.filter(
                AreaSurcharge.postalCodeFrom <= zip_code,
                AreaSurcharge.postalCodeTo >= zip_code
            ).first()
        if not legacy_surcharge and city_str:
            legacy_surcharge = query.filter(AreaSurcharge.locationName.ilike(f"%{city_str}%")).first()

        if legacy_surcharge:
            type_name = getattr(legacy_surcharge, "surchargeType", "Area Surcharge")
            msg = f"({type_name} applied for this destination)"
            return {
                "hasSurcharge": True,
                "success": True,
                "surchargeType": type_name,
                "surchargeMessage": msg,
                "formattedWarning": msg,
                "countryCode": legacy_surcharge.countryCode
            }
    except Exception:
        pass

    return {"hasSurcharge": False, "success": False}


@router.post("/check")
def check_surcharge(
    payload: SurchargeCheckRequest,
    db: Session = Depends(get_db)
):
    """
    Checks if given postal code or city matches any uploaded surcharge rules with smart normalization.
    """
    country_val = payload.country or payload.countryName
    return perform_smart_surcharge_check(
        db=db,
        postal_code=payload.postalCode,
        city=payload.city,
        country=country_val,
        address_line=payload.addressLine1,
        state=payload.state,
        service=payload.service
    )


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
