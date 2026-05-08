from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import Optional
from app.db.database import get_db
from app.models.models import Booking, Payment, Room, User, Review, StaffTask, BookingStatus, PaymentStatus
from app.schemas.schemas import AnalyticsSummary
from app.core.security import require_role

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(db: Session = Depends(get_db), _=Depends(require_role("admin", "staff"))):
    total_bookings = db.query(Booking).count()
    total_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == PaymentStatus.paid).scalar() or 0
    total_rooms = db.query(Room).filter(Room.is_active == True).count()
    available_rooms = db.query(Room).filter(Room.status == "available", Room.is_active == True).count()
    occupancy_rate = ((total_rooms - available_rooms) / total_rooms * 100) if total_rooms else 0
    avg_rating = db.query(func.avg(Review.rating)).scalar() or 0
    pending_tasks = db.query(StaffTask).filter(StaffTask.status == "pending").count()
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_customers = db.query(User).filter(User.role == "customer", User.created_at >= thirty_days_ago).count()

    return AnalyticsSummary(
        total_bookings=total_bookings,
        total_revenue=round(float(total_revenue), 2),
        occupancy_rate=round(occupancy_rate, 1),
        avg_rating=round(float(avg_rating), 1),
        total_rooms=total_rooms,
        available_rooms=available_rooms,
        pending_tasks=pending_tasks,
        new_customers=new_customers
    )


@router.get("/revenue")
async def get_revenue_trend(
    period: str = Query("monthly", enum=["daily", "weekly", "monthly"]),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin"))
):
    now = datetime.utcnow()
    if period == "daily":
        start = now - timedelta(days=30)
        results = db.query(
            func.date(Payment.paid_at).label("date"),
            func.sum(Payment.amount).label("revenue"),
            func.count(Payment.id).label("bookings")
        ).filter(Payment.paid_at >= start, Payment.status == PaymentStatus.paid).group_by(func.date(Payment.paid_at)).all()
    elif period == "weekly":
        start = now - timedelta(weeks=12)
        results = db.query(
            func.date_trunc("week", Payment.paid_at).label("date"),
            func.sum(Payment.amount).label("revenue"),
            func.count(Payment.id).label("bookings")
        ).filter(Payment.paid_at >= start, Payment.status == PaymentStatus.paid).group_by(func.date_trunc("week", Payment.paid_at)).all()
    else:
        start = now - timedelta(days=365)
        results = db.query(
            func.date_trunc("month", Payment.paid_at).label("date"),
            func.sum(Payment.amount).label("revenue"),
            func.count(Payment.id).label("bookings")
        ).filter(Payment.paid_at >= start, Payment.status == PaymentStatus.paid).group_by(func.date_trunc("month", Payment.paid_at)).all()

    return [{"date": str(r.date), "revenue": float(r.revenue or 0), "bookings": r.bookings} for r in results]


@router.get("/bookings-by-status")
async def bookings_by_status(db: Session = Depends(get_db), _=Depends(require_role("admin", "staff"))):
    results = db.query(Booking.status, func.count(Booking.id)).group_by(Booking.status).all()
    return [{"status": r[0], "count": r[1]} for r in results]


@router.get("/rooms-occupancy")
async def rooms_occupancy(db: Session = Depends(get_db), _=Depends(require_role("admin", "staff"))):
    results = db.query(Room.room_type, func.count(Room.id).label("total"),
        func.sum(func.cast(Room.status == "booked", db.bind.dialect.name == "postgresql" and "integer" or "integer")).label("booked")
    ).group_by(Room.room_type).all()
    return [{"type": r[0], "total": r[1]} for r in results]


@router.get("/top-rooms")
async def top_rooms(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    results = db.query(
        Room.name, Room.room_type,
        func.count(Booking.id).label("bookings"),
        func.sum(Payment.amount).label("revenue"),
        func.avg(Review.rating).label("rating")
    ).join(Booking, Booking.room_id == Room.id, isouter=True)\
     .join(Payment, Payment.booking_id == Booking.id, isouter=True)\
     .join(Review, Review.room_id == Room.id, isouter=True)\
     .group_by(Room.id, Room.name, Room.room_type)\
     .order_by(func.count(Booking.id).desc()).limit(5).all()

    return [{"name": r.name, "type": r.room_type, "bookings": r.bookings or 0,
             "revenue": float(r.revenue or 0), "rating": float(r.rating or 0)} for r in results]


@router.get("/customer-stats")
async def customer_stats(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    total = db.query(User).filter(User.role == "customer").count()
    new = db.query(User).filter(User.role == "customer", User.created_at >= datetime.utcnow() - timedelta(days=30)).count()
    returning = db.query(User.id).join(Booking).filter(User.role == "customer").group_by(User.id).having(func.count(Booking.id) > 1).count()
    return {"total_customers": total, "new_this_month": new, "returning": returning}
