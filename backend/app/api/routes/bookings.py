from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import random, string, qrcode, io, base64
from app.db.database import get_db
from app.models.models import Booking, Room, User, Coupon, Notification, LoyaltyTransaction, BookingStatus, RoomStatus
from app.schemas.schemas import BookingCreate, BookingUpdate, BookingOut
from app.core.security import get_current_user, require_role
from app.services.pricing import calculate_dynamic_price

router = APIRouter()

GST_RATE = 0.18
LOYALTY_EARN_RATE = 10  # points per ₹100


def gen_ref():
    return "SS" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def gen_qr(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


@router.get("/", response_model=List[BookingOut])
async def get_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["admin", "staff"]:
        bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    else:
        bookings = db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).all()
    return bookings


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user.role == "customer" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return booking


@router.post("/", response_model=BookingOut)
async def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == data.room_id, Room.is_active == True).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check availability
    conflict = db.query(Booking).filter(
        Booking.room_id == data.room_id,
        Booking.status.in_([BookingStatus.confirmed, BookingStatus.checked_in]),
        Booking.check_in < data.check_out,
        Booking.check_out > data.check_in
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Room not available for selected dates")

    nights = (data.check_out - data.check_in).days
    if nights <= 0:
        raise HTTPException(status_code=400, detail="Invalid dates")

    price = calculate_dynamic_price(room.base_price, data.check_in, db)
    total = price * nights
    discount = 0.0

    # Apply coupon
    if data.coupon_code:
        coupon = db.query(Coupon).filter(
            Coupon.code == data.coupon_code,
            Coupon.is_active == True
        ).first()
        if coupon:
            if coupon.valid_until and coupon.valid_until.replace(tzinfo=None) < datetime.utcnow():
                raise HTTPException(status_code=400, detail="Coupon expired")
            if total < coupon.min_booking_amount:
                raise HTTPException(status_code=400, detail=f"Minimum booking amount ₹{coupon.min_booking_amount}")
            discount = total * (coupon.discount_pct / 100)
            if coupon.max_discount:
                discount = min(discount, coupon.max_discount)
            coupon.used_count += 1

    # Loyalty points redemption (100 pts = ₹50)
    loyalty_discount = 0.0
    if data.use_loyalty_points and current_user.loyalty_points >= 100:
        loyalty_discount = min(current_user.loyalty_points // 100 * 50, total * 0.2)
        discount += loyalty_discount

    subtotal = total - discount
    gst = subtotal * GST_RATE
    final = subtotal + gst

    booking = Booking(
        booking_ref=gen_ref(),
        user_id=current_user.id,
        room_id=data.room_id,
        check_in=data.check_in,
        check_out=data.check_out,
        guests=data.guests,
        status=BookingStatus.confirmed,
        total_amount=total,
        discount_amount=discount,
        gst_amount=gst,
        final_amount=final,
        coupon_code=data.coupon_code,
        special_requests=data.special_requests
    )
    db.add(booking)
    db.flush()

    # Generate QR
    booking.qr_code_url = f"STAYSYNC:{booking.booking_ref}:{booking.id}"

    # Earn loyalty points
    pts_earned = int(final / 100) * LOYALTY_EARN_RATE
    if pts_earned > 0:
        current_user.loyalty_points += pts_earned
        db.add(LoyaltyTransaction(
            user_id=current_user.id,
            points=pts_earned,
            transaction_type="earned",
            booking_id=booking.id,
            description=f"Points earned for booking {booking.booking_ref}"
        ))

    # Notification
    db.add(Notification(
        user_id=current_user.id,
        title="Booking Confirmed! 🎉",
        message=f"Your booking {booking.booking_ref} for {room.name} is confirmed. Check-in: {data.check_in.strftime('%d %b %Y')}",
        notification_type="success"
    ))

    db.commit()
    db.refresh(booking)
    return booking


@router.put("/{booking_id}", response_model=BookingOut)
async def update_booking(
    booking_id: int,
    data: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user.role == "customer" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if data.status:
        booking.status = data.status
        if data.status == BookingStatus.checked_in:
            booking.room.status = RoomStatus.booked
        elif data.status in [BookingStatus.checked_out, BookingStatus.cancelled]:
            booking.room.status = RoomStatus.cleaning

        db.add(Notification(
            user_id=booking.user_id,
            title=f"Booking {data.status.replace('_', ' ').title()}",
            message=f"Your booking {booking.booking_ref} status updated to {data.status}",
            notification_type="info"
        ))

    if data.special_requests is not None:
        booking.special_requests = data.special_requests

    db.commit()
    db.refresh(booking)
    return booking


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user.role == "customer" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    booking.status = BookingStatus.cancelled
    db.commit()
    return {"message": "Booking cancelled"}
