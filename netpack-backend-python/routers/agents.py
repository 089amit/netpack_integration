from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.mawb import Agent

router = APIRouter(prefix="/api/agents", tags=["Agents"])

class AgentCreateRequest(BaseModel):
    name: str
    companyName: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    code: str
    isActive: Optional[bool] = True

class AgentUpdateRequest(BaseModel):
    name: Optional[str] = None
    companyName: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    code: Optional[str] = None
    isActive: Optional[bool] = None

def format_agent(a: Agent) -> dict:
    return {
        "id": a.id,
        "name": a.name or "",
        "companyName": a.companyName or "",
        "country": a.country or "",
        "address": a.address or "",
        "city": a.city or "",
        "state": a.state or "",
        "postcode": a.postcode or "",
        "phone": a.phone or "",
        "email": a.email or "",
        "code": a.code or "",
        "isActive": a.isActive if a.isActive is not None else True,
        "createdAt": a.createdAt.isoformat() if a.createdAt else None,
        "updatedAt": a.updatedAt.isoformat() if a.updatedAt else None
    }

@router.get("")
@router.get("/")
def get_all_agents(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Agent)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Agent.name.ilike(s)) |
            (Agent.code.ilike(s)) |
            (Agent.companyName.ilike(s)) |
            (Agent.city.ilike(s)) |
            (Agent.country.ilike(s))
        )
    agents = query.all()
    res = [format_agent(a) for a in agents]
    return {"data": res, "message": "Agents fetched successfully"}

@router.get("/{id}")
def get_agent_by_id(id: int, db: Session = Depends(get_db)):
    a = db.query(Agent).filter(Agent.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agent not found")
    return format_agent(a)

@router.post("")
@router.post("/")
def create_agent(payload: AgentCreateRequest, db: Session = Depends(get_db)):
    a = Agent(
        name=payload.name,
        companyName=payload.companyName,
        country=payload.country,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        postcode=payload.postcode,
        phone=payload.phone,
        email=payload.email,
        code=payload.code.upper(),
        isActive=payload.isActive if payload.isActive is not None else True
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return format_agent(a)

@router.put("/{id}")
def update_agent(id: int, payload: AgentUpdateRequest, db: Session = Depends(get_db)):
    a = db.query(Agent).filter(Agent.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agent not found")

    if payload.name is not None:
        a.name = payload.name
    if payload.companyName is not None:
        a.companyName = payload.companyName
    if payload.country is not None:
        a.country = payload.country
    if payload.address is not None:
        a.address = payload.address
    if payload.city is not None:
        a.city = payload.city
    if payload.state is not None:
        a.state = payload.state
    if payload.postcode is not None:
        a.postcode = payload.postcode
    if payload.phone is not None:
        a.phone = payload.phone
    if payload.email is not None:
        a.email = payload.email
    if payload.code is not None:
        a.code = payload.code.upper()
    if payload.isActive is not None:
        a.isActive = payload.isActive

    db.commit()
    db.refresh(a)
    return format_agent(a)

@router.delete("/{id}")
def delete_agent(id: int, db: Session = Depends(get_db)):
    a = db.query(Agent).filter(Agent.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.delete(a)
    db.commit()
    return {"message": "Agent deleted successfully"}

@router.patch("/{id}/active")
def set_agent_active(id: int, db: Session = Depends(get_db)):
    a = db.query(Agent).filter(Agent.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agent not found")
    a.isActive = not a.isActive
    db.commit()
    return {"message": "Agent status updated", "isActive": a.isActive}
