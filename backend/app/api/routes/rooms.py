from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.models.models import Room, Booking, Review, BookingStatus, RoomStatus
from app.schemas.schemas import RoomCreate, RoomUpdate, RoomOut
from app.core.security import get_current_user, require_role
from app.services.pricing import calculate_dynamic_price

router = APIRouter()


@router.get("/", response_model=List[RoomOut])
async def get_rooms(
    room_type: Optional[str] = None,
    check_in: Optional[datetime] = None,
    check_out: Optional[datetime] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    capacity: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Room).filter(Room.is_active == True)
    if room_type:
        query = query.filter(Room.room_type == room_type)
    if capacity:
        query = query.filter(Room.capacity >= capacity)
    if min_price:
        query = query.filter(Room.current_price >= min_price)
    if max_price:
        query = query.filter(Room.current_price <= max_price)

    rooms = query.all()

    # Filter by availability if dates provided
    if check_in and check_out:
        booked_ids = db.query(Booking.room_id).filter(
            Booking.status.in_([BookingStatus.confirmed, BookingStatus.checked_in]),
            Booking.check_in < check_out,
            Booking.check_out > check_in
        ).all()
        booked_ids = {r[0] for r in booked_ids}
        rooms = [r for r in rooms if r.id not in booked_ids]

    # Attach avg rating
    result = []
    for room in rooms:
        avg = db.query(func.avg(Review.rating)).filter(Review.room_id == room.id).scalar()
        room_out = RoomOut.model_validate(room)
        room_out.avg_rating = round(avg, 1) if avg else None
        # Apply dynamic pricing
        room_out.current_price = calculate_dynamic_price(room.base_price, check_in, db)
        result.append(room_out)
    return result


@router.get("/{room_id}", response_model=RoomOut)
async def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    avg = db.query(func.avg(Review.rating)).filter(Review.room_id == room_id).scalar()
    room_out = RoomOut.model_validate(room)
    room_out.avg_rating = round(avg, 1) if avg else None
    return room_out


@router.post("/", response_model=RoomOut)
async def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin"))
):
    if db.query(Room).filter(Room.room_number == data.room_number).first():
        raise HTTPException(status_code=400, detail="Room number already exists")
    room = Room(**data.model_dump(), current_price=data.base_price)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.put("/{room_id}", response_model=RoomOut)
async def update_room(
    room_id: int,
    data: RoomUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin"))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(room, k, v)
    if data.base_price:
        room.current_price = data.base_price
    db.commit()
    db.refresh(room)
    return room


@router.delete("/{room_id}")
async def delete_room(room_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.is_active = False
    db.commit()
    return {"message": "Room deleted"}


@router.get("/{room_id}/availability")
async def check_availability(room_id: int, check_in: datetime, check_out: datetime, db: Session = Depends(get_db)):
    conflict = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.status.in_([BookingStatus.confirmed, BookingStatus.checked_in]),
        Booking.check_in < check_out,
        Booking.check_out > check_in
    ).first()
    return {"available": conflict is None}
