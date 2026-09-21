from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models.mawb import ForwardingCompany, ForwardingService

router = APIRouter(prefix="/api/forwarding-companies", tags=["Forwarding Companies"])

class CompanyCreate(BaseModel):
    name: str
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    address: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    address: Optional[str] = None

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    companyId: int

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    companyId: Optional[int] = None

@router.get("")
@router.get("/")
def get_all_companies(db: Session = Depends(get_db)):
    companies = db.query(ForwardingCompany).all()
    res = []
    for c in companies:
        res.append({
            "id": c.id,
            "name": c.name,
            "contactEmail": c.contactEmail,
            "contactPhone": c.contactPhone,
            "address": c.address,
            "createdAt": c.createdAt.isoformat() if c.createdAt else None,
            "updatedAt": c.updatedAt.isoformat() if c.updatedAt else None,
            "services": [{"id": s.id, "name": s.name, "description": s.description} for s in c.services]
        })
    return {"data": res}

@router.post("")
@router.post("/")
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    c = ForwardingCompany(
        name=payload.name,
        contactEmail=payload.contactEmail,
        contactPhone=payload.contactPhone,
        address=payload.address
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.get("/{id}")
def get_company_by_id(id: int, db: Session = Depends(get_db)):
    c = db.query(ForwardingCompany).filter(ForwardingCompany.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    return {
        "id": c.id,
        "name": c.name,
        "contactEmail": c.contactEmail,
        "contactPhone": c.contactPhone,
        "address": c.address,
        "services": [{"id": s.id, "name": s.name, "description": s.description} for s in c.services]
    }

@router.put("/{id}")
def update_company(id: int, payload: CompanyUpdate, db: Session = Depends(get_db)):
    c = db.query(ForwardingCompany).filter(ForwardingCompany.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    if payload.name is not None:
        c.name = payload.name
    if payload.contactEmail is not None:
        c.contactEmail = payload.contactEmail
    if payload.contactPhone is not None:
        c.contactPhone = payload.contactPhone
    if payload.address is not None:
        c.address = payload.address
    db.commit()
    return c

@router.delete("/{id}")
def delete_company(id: int, db: Session = Depends(get_db)):
    c = db.query(ForwardingCompany).filter(ForwardingCompany.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(c)
    db.commit()
    return {"message": "Company deleted"}

# --- SERVICES ---

@router.get("/services")
def get_all_services(db: Session = Depends(get_db)):
    return db.query(ForwardingService).all()

@router.get("/services/{id}")
def get_service_by_id(id: int, db: Session = Depends(get_db)):
    s = db.query(ForwardingService).filter(ForwardingService.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Service not found")
    return s

@router.get("/services/company/{companyId}")
def get_services_by_company(companyId: int, db: Session = Depends(get_db)):
    return db.query(ForwardingService).filter(ForwardingService.companyId == companyId).all()

@router.post("/services")
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)):
    s = ForwardingService(
        name=payload.name,
        description=payload.description,
        companyId=payload.companyId
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.put("/services/{id}")
def update_service(id: int, payload: ServiceUpdate, db: Session = Depends(get_db)):
    s = db.query(ForwardingService).filter(ForwardingService.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Service not found")
    if payload.name is not None:
        s.name = payload.name
    if payload.description is not None:
        s.description = payload.description
    if payload.companyId is not None:
        s.companyId = payload.companyId
    db.commit()
    return s

@router.delete("/services/{id}")
def delete_service(id: int, db: Session = Depends(get_db)):
    s = db.query(ForwardingService).filter(ForwardingService.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(s)
    db.commit()
    return {"message": "Service deleted"}
