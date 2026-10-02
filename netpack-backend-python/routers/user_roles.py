from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import get_db
from models.user import Role, User
from services.auth_service import get_current_admin

router = APIRouter(prefix="/api/userRoles", tags=["UserRoles"])

class RoleCreate(BaseModel):
    name: str

@router.get("")
@router.get("/")
def get_all_roles(db: Session = Depends(get_db)):
    # Automatically unify OPERATION into OPERATIONS if both exist
    try:
        ops = db.query(Role).filter(func.upper(Role.name) == "OPERATIONS").first()
        op = db.query(Role).filter(func.upper(Role.name) == "OPERATION").first()
        if op:
            if not ops:
                op.name = "OPERATIONS"
                db.commit()
            else:
                db.query(User).filter(User.roleId == op.id).update({"roleId": ops.id})
                db.delete(op)
                db.commit()
    except Exception as err:
        db.rollback()
        print(f"[Role Unify Error] {err}")

    # Customers are not administrative or portal users managed in the user table.
    roles = db.query(Role).filter(
        func.upper(Role.name) != "CUSTOMER",
        func.upper(Role.name) != "OPERATION"
    ).order_by(Role.id).all()
    return {"roles": [{"id": r.id, "name": r.name} for r in roles]}

@router.post("")
@router.post("/")
def create_role(payload: RoleCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    clean_name = payload.name.strip().upper()
    if clean_name == "OPERATION":
        clean_name = "OPERATIONS"

    existing = db.query(Role).filter(func.upper(Role.name) == clean_name).first()
    if existing:
        return {"id": existing.id, "name": existing.name}
    r = Role(name=clean_name)
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
