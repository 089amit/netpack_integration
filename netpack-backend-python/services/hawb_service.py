import random
import string
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models.shipment import Shipment

def generate_tracking_number() -> str:
    """Generates a random NetPack tracking number: NP-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    p1 = "".join(random.choices(chars, k=4))
    p2 = "".join(random.choices(chars, k=4))
    return f"NP-{p1}-{p2}"

def compute_next_hawb_for_agent(db: Session, agent_code: str, year_optional: Optional[int] = None) -> Dict[str, Any]:
    year = year_optional or datetime.utcnow().year
    start_of_year = datetime(year, 1, 1)
    start_of_next_year = datetime(year + 1, 1, 1)

    # Find existing shipments by agent or hawbno prefix
    shipments = db.query(Shipment).filter(
        (Shipment.agent == agent_code) |
        (Shipment.hawbno.ilike(f"{agent_code} {year}%"))
    ).all()

    max_sequence = 0
    for s in shipments:
        if not s.hawbno:
            continue
        parts = s.hawbno.strip().split(" ")
        seq_str = parts[-1]
        try:
            num = int(seq_str)
            if num > max_sequence:
                max_sequence = num
        except (ValueError, TypeError):
            continue

    next_sequence = max_sequence + 1
    padded_seq = str(next_sequence).zfill(3)
    hawbno = f"{agent_code} {year} {padded_seq}"

    return {
        "year": year,
        "nextSequence": next_sequence,
        "hawbno": hawbno,
        "agent": agent_code,
        "agentCode": agent_code
    }
