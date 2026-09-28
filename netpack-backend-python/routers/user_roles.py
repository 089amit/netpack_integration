from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import get_db
from models.user import Role
from services.auth_service import get_current_admin

router = APIRouter(prefix="/api/userRoles", tags=["UserRoles"])

class RoleCreate(BaseModel):
    name: str

@router.get("")
@router.get("/")
def get_all_roles(db: Session = Depends(get_db)):
    # Customers are not administrative or portal users managed in the user table.
    roles = db.query(Role).filter(func.upper(Role.name) != "CUSTOMER").all()
    return {"roles": [{"id": r.id, "name": r.name} for r in roles]}

@router.post("")
@router.post("/")
def create_role(payload: RoleCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    existing = db.query(Role).filter(Role.name == payload.name).first()
    if existing:
        return {"id": existing.id, "name": existing.name}
    r = Role(name=payload.name)
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"id": r.id, "name": r.name}

@router.delete("/{id}")
def delete_role(id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    r = db.query(Role).filter(Role.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(r)
    db.commit()
    return {"message": "Role deleted"}
