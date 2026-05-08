from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import User, Notification, Room, Booking
from app.schemas.schemas import UserUpdate, UserOut, NotificationOut, ChatMessage
from app.core.security import get_current_user, require_role, get_password_hash
from app.core.config import settings

# ─── Users Router ─────────────────────────────────────────────────────────────
users_router = APIRouter()

@users_router.get("/", response_model=List[UserOut])
async def get_users(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    return db.query(User).all()

@users_router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@users_router.put("/me", response_model=UserOut)
async def update_profile(data: UserUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(current_user, k, v)
    db.commit()
    db.refresh(current_user)
    return current_user

@users_router.put("/{user_id}/toggle-active")
async def toggle_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"is_active": user.is_active}

@users_router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Simple recommendation: suggest rooms from same category user has booked
    past = db.query(Booking).filter(Booking.user_id == user_id).join(Room).all()
    if past:
        preferred_type = max(set(b.room.room_type for b in past), key=lambda t: sum(1 for b in past if b.room.room_type == t))
        rooms = db.query(Room).filter(Room.room_type == preferred_type, Room.status == "available", Room.is_active == True).limit(4).all()
    else:
        rooms = db.query(Room).filter(Room.status == "available", Room.is_active == True).limit(4).all()
    return rooms


# ─── Notifications Router ─────────────────────────────────────────────────────
notifications_router = APIRouter()

@notifications_router.get("/", response_model=List[NotificationOut])
async def get_notifications(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50).all()

@notifications_router.put("/{notif_id}/read")
async def mark_read(notif_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}

@notifications_router.put("/read-all")
async def mark_all_read(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id).update({"is_read": True})
    db.commit()
    return {"message": "All marked as read"}


# ─── Chatbot Router ───────────────────────────────────────────────────────────
chatbot_router = APIRouter()

@chatbot_router.post("/chat")
async def chat(data: ChatMessage, db: Session = Depends(get_db)):
    rooms = db.query(Room).filter(Room.is_active == True).all()
    room_info = "\n".join([f"- {r.name} ({r.room_type}): ₹{r.current_price}/night, Capacity: {r.capacity}" for r in rooms[:10]])

    system_prompt = f"""You are StaySync's friendly hotel assistant. Help customers with bookings, room info, and hotel queries.

Available Rooms:
{room_info}

Hotel Policies:
- Check-in: 2:00 PM | Check-out: 11:00 AM
- GST: 18% on all bookings
- Free cancellation 24 hours before check-in
- Loyalty points: 10 pts per ₹100 spent (100 pts = ₹50 discount)

Be helpful, friendly, and concise. For bookings, guide them to the booking page."""

    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(data.conversation_history[-10:])
        messages.append({"role": "user", "content": data.message})
        response = client.chat.completions.create(model="llama-3.3-70b-versatile", messages=messages, max_tokens=500)
        return {"reply": response.choices[0].message.content}
    except Exception:
        # Fallback responses
        msg = data.message.lower()
        if "room" in msg or "book" in msg:
            return {"reply": f"We have {len(rooms)} rooms available! Our options include Standard (budget-friendly), Deluxe (mid-range), and Suite (luxury). Check-in is 2 PM and check-out is 11 AM. Visit our Rooms page to see live availability and book instantly!"}
        elif "price" in msg or "cost" in msg or "rate" in msg:
            return {"reply": "Our room prices vary by type and season. Standard rooms start from ₹2,000/night, Deluxe from ₹4,000/night, and Suites from ₹8,000/night. We also have seasonal discounts and loyalty rewards!"}
        elif "cancel" in msg:
            return {"reply": "You can cancel your booking for free up to 24 hours before check-in. After that, a cancellation fee may apply. Go to My Bookings > Cancel Booking."}
        elif "loyalty" in msg or "points" in msg:
            return {"reply": "Our loyalty program rewards you with 10 points per ₹100 spent. Every 100 points = ₹50 discount on future bookings. Check your points balance in your profile!"}
        else:
            return {"reply": "Hello! I'm StaySync's assistant. I can help you with room bookings, availability, prices, hotel policies, and more. What would you like to know?"}
