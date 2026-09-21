from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.policy import TermsAndPolicy
from schemas.location import PolicyCreateRequest, PolicyUpdateRequest

router = APIRouter(prefix="/api/policies", tags=["Policies"])

@router.get("")
@router.get("/")
def get_all_policies(db: Session = Depends(get_db)):
    return db.query(TermsAndPolicy).all()

@router.get("/active")
def get_active_policies(db: Session = Depends(get_db)):
    return db.query(TermsAndPolicy).filter(TermsAndPolicy.isActive == True).all()

@router.get("/{slug}")
def get_policy_by_slug(slug: str, db: Session = Depends(get_db)):
    p = db.query(TermsAndPolicy).filter(TermsAndPolicy.slug == slug).first()
    if not p:
        raise HTTPException(status_code=404, detail="Policy not found")
    return p

@router.post("")
@router.post("/")
def create_policy(payload: PolicyCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(TermsAndPolicy).filter(TermsAndPolicy.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy with this slug already exists")
    p = TermsAndPolicy(
        title=payload.title,
        slug=payload.slug,
        content=payload.content,
        isActive=payload.isActive if payload.isActive is not None else True
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.put("/{id}")
def update_policy(id: int, payload: PolicyUpdateRequest, db: Session = Depends(get_db)):
    p = db.query(TermsAndPolicy).filter(TermsAndPolicy.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Policy not found")
    if payload.title is not None: p.title = payload.title
    if payload.slug is not None: p.slug = payload.slug
    if payload.content is not None: p.content = payload.content
    if payload.isActive is not None: p.isActive = payload.isActive
    db.commit()
    return p

@router.delete("/{id}")
def delete_policy(id: int, db: Session = Depends(get_db)):
    p = db.query(TermsAndPolicy).filter(TermsAndPolicy.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(p)
    db.commit()
    return {"message": "Policy deleted successfully"}
