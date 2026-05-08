from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Review, Booking, BookingStatus
from app.schemas.schemas import ReviewCreate, ReviewOut
from app.core.security import get_current_user, require_role

router = APIRouter()


@router.get("/room/{room_id}", response_model=List[ReviewOut])
async def get_room_reviews(room_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.room_id == room_id, Review.is_visible == True).all()


@router.get("/", response_model=List[ReviewOut])
async def get_all_reviews(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    return db.query(Review).order_by(Review.created_at.desc()).all()


@router.post("/", response_model=ReviewOut)
async def create_review(data: ReviewCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if data.booking_id:
        booking = db.query(Booking).filter(Booking.id == data.booking_id, Booking.user_id == current_user.id).first()
        if not booking or booking.status != BookingStatus.checked_out:
            raise HTTPException(status_code=400, detail="Can only review after checkout")
        existing = db.query(Review).filter(Review.booking_id == data.booking_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Already reviewed this booking")
    review = Review(user_id=current_user.id, **data.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.put("/{review_id}/respond")
async def respond_to_review(review_id: int, response: str, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.admin_response = response
    db.commit()
    return {"message": "Response added"}


@router.delete("/{review_id}")
async def hide_review(review_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_visible = False
    db.commit()
    return {"message": "Review hidden"}
