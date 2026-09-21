import math
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models.location import Country, Zone, AreaSurcharge
from models.rate import Rate, TIACharge, CustomCharge, PackingCharge

def calculate_ceiling_weight(weight: float) -> float:
    if weight is None or weight <= 0:
        raise ValueError("Invalid weight: must be a positive number.")
    if weight <= 10.0:
        return math.ceil(weight * 2) / 2.0  # Nearest 0.5 kg
    else:
        return float(math.ceil(weight))     # Nearest whole kg

def calculate_number_of_boxes(weight: float, box_weight_limit: Optional[float]) -> int:
    if weight is None or weight <= 0:
        raise ValueError("Invalid weight: must be a positive number.")
    if not box_weight_limit or box_weight_limit <= 0:
        raise ValueError("Invalid boxWeightLimit: must be a positive number.")
    return math.ceil(weight / box_weight_limit)

def compute_shipping_rate(db: Session, weight: float, destination: str) -> Dict[str, Any]:
    # 1. Fetch destination country
    dest_country = db.query(Country).filter(Country.name == destination).first()
    if not dest_country:
        dest_country = db.query(Country).filter(Country.name.ilike(f"%{destination}%")).first()
    
    if not dest_country:
        raise ValueError(f'Destination country "{destination}" not found.')

    box_weight_limit = dest_country.boxWeightLimit
    if not box_weight_limit:
        raise ValueError(
            f'Box weight has not been added for country "{destination}". Please configure the box weight limit.'
        )

    # 2. Ceiling weight and boxes
    number_of_boxes = calculate_number_of_boxes(weight, box_weight_limit)
    ceiling_weight = calculate_ceiling_weight(weight)

    # 3. Dynamic charges
    tia_record = db.query(TIACharge).first()
    custom_record = db.query(CustomCharge).first()
    packing_record = db.query(PackingCharge).first()

    tia_rate = float(tia_record.rate or 0) if tia_record else 0.0
    custom_rate = float(custom_record.rate or 0) if custom_record else 0.0
    packing_rate = float(packing_record.rate or 0) if packing_record else 0.0

    # 4. Find applicable rate slab (Country first, then Zone)
    rate_record = db.query(Rate).filter(
        Rate.weightFrom <= ceiling_weight,
        Rate.weightTo >= ceiling_weight,
        Rate.countryId == dest_country.id
    ).first()

    if not rate_record and dest_country.zoneId:
        rate_record = db.query(Rate).filter(
            Rate.weightFrom <= ceiling_weight,
            Rate.weightTo >= ceiling_weight,
            Rate.zoneId == dest_country.zoneId
        ).first()

    if not rate_record:
        raise ValueError(
            f'Rate for the weight {ceiling_weight}kg has not been added for destination "{destination}".'
        )

    is_per_kg = bool(rate_record.isPerKg)
    rate_val = float(rate_record.rate)
    additional_box_rate = number_of_boxes * packing_rate

    if is_per_kg:
        base_rate = ceiling_weight * rate_val
        tia_charge = tia_rate * ceiling_weight
        custom_charge = number_of_boxes * custom_rate
        total_rate = base_rate + tia_charge + custom_charge + additional_box_rate
    else:
        base_rate = rate_val
        tia_charge = ceiling_weight * tia_rate
        custom_charge = number_of_boxes * custom_rate
        total_rate = base_rate + tia_charge + custom_charge + additional_box_rate

    rate_per_kg = "-" if weight < 1 else round(total_rate / weight, 2)

    breakdown = {
        "baseRate": round(base_rate, 2),
        "tiaCharge": round(tia_charge, 2),
        "customCharge": round(custom_charge, 2),
        "additionalBoxRate": round(additional_box_rate, 2),
        "numberOfBoxes": number_of_boxes,
        "isPerKg": is_per_kg
    }

    return {
        "weight": weight,
        "ceilingWeight": ceiling_weight,
        "chargeableWeight": ceiling_weight,
        "volumetricWeight": 0,
        "destination": dest_country.name,
        "numberOfBoxes": number_of_boxes,
        "totalRate": round(total_rate, 2),
        "ratePerKg": rate_per_kg,
        "breakdown": breakdown,
        "isPerKg": is_per_kg
    }
