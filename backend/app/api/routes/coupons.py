from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Coupon
from app.schemas.schemas import CouponCreate, CouponOut
from app.core.security import require_role

router = APIRouter()

@router.get("/", response_model=List[CouponOut])
async def get_coupons(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    return db.query(Coupon).order_by(Coupon.created_at.desc()).all()

@router.post("/", response_model=CouponOut)
async def create_coupon(data: CouponCreate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    if db.query(Coupon).filter(Coupon.code == data.code).first():
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    coupon = Coupon(**data.model_dump(), is_active=True)
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon

@router.put("/{coupon_id}/toggle")
async def toggle_coupon(coupon_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    coupon.is_active = not coupon.is_active
    db.commit()
    return {"is_active": coupon.is_active}

@router.get("/validate/{code}")
async def validate_coupon(code: str, amount: float, db: Session = Depends(get_db)):
    from datetime import datetime
    coupon = db.query(Coupon).filter(Coupon.code == code, Coupon.is_active == True).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    if coupon.valid_until and coupon.valid_until < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Coupon has expired")
    if amount < coupon.min_booking_amount:
        raise HTTPException(status_code=400, detail=f"Minimum booking amount is ₹{coupon.min_booking_amount}")
    if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    discount = min(amount * coupon.discount_pct / 100, coupon.max_discount or float('inf'))
    return {"valid": True, "discount": round(discount, 2), "discount_pct": coupon.discount_pct}
