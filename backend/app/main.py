from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.api.routes import auth, rooms, bookings, payments, staff, reviews, analytics, coupons
from app.api.routes.users_notif_chat import users_router, notifications_router, chatbot_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="StaySync API", version="1.0.0", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("invoices", exist_ok=True)
app.mount("/invoices", StaticFiles(directory="invoices"), name="invoices")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(staff.router, prefix="/api/staff", tags=["Staff"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(coupons.router, prefix="/api/coupons", tags=["Coupons"])


@app.on_event("startup")
async def startup():
    db = SessionLocal()
    try:
        from app.services.pricing import seed_pricing_rules
        from app.models.models import User, Room, Coupon, RoomType
        from app.core.security import get_password_hash
        from datetime import datetime, timedelta

        seed_pricing_rules(db)

        if not db.query(User).filter(User.email == "admin@staysync.com").first():
            db.add(User(name="Admin User", email="admin@staysync.com", password_hash=get_password_hash("admin123"), role="admin"))
        if not db.query(User).filter(User.email == "staff@staysync.com").first():
            db.add(User(name="Staff Member", email="staff@staysync.com", password_hash=get_password_hash("staff123"), role="staff"))
        if not db.query(User).filter(User.email == "customer@staysync.com").first():
            db.add(User(name="John Doe", email="customer@staysync.com", password_hash=get_password_hash("customer123"), role="customer", loyalty_points=250))

        if db.query(Room).count() == 0:
            rooms_data = [
                Room(room_number="101", name="Comfort Standard", room_type=RoomType.standard, floor=1, base_price=2500, current_price=2500, capacity=2, size_sqft=250, amenities=["WiFi", "AC", "TV", "Hot Water"], images=["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"], description="Cozy standard room with all basic amenities."),
                Room(room_number="102", name="Classic Standard", room_type=RoomType.standard, floor=1, base_price=2800, current_price=2800, capacity=2, size_sqft=280, amenities=["WiFi", "AC", "TV", "Mini Fridge"], images=["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800"], description="Classic standard room with mini fridge."),
                Room(room_number="201", name="Deluxe Garden View", room_type=RoomType.deluxe, floor=2, base_price=4500, current_price=4500, capacity=2, size_sqft=400, amenities=["WiFi", "AC", "Smart TV", "Mini Bar", "Balcony", "Room Service"], images=["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800"], description="Elegant deluxe room with garden view balcony."),
                Room(room_number="202", name="Deluxe City View", room_type=RoomType.deluxe, floor=2, base_price=5000, current_price=5000, capacity=3, size_sqft=450, amenities=["WiFi", "AC", "Smart TV", "Mini Bar", "City View", "Room Service", "Bathtub"], images=["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"], description="Stunning deluxe room with panoramic city view."),
                Room(room_number="301", name="Presidential Suite", room_type=RoomType.suite, floor=3, base_price=12000, current_price=12000, capacity=4, size_sqft=900, amenities=["WiFi", "AC", "Smart TV", "Mini Bar", "Private Pool", "Butler Service", "Jacuzzi", "Living Room", "Kitchen"], images=["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800"], description="Ultimate luxury suite with private pool and butler service."),
                Room(room_number="302", name="Royal Suite", room_type=RoomType.suite, floor=3, base_price=9500, current_price=9500, capacity=4, size_sqft=750, amenities=["WiFi", "AC", "Smart TV", "Mini Bar", "Jacuzzi", "Living Room", "Dining Area"], images=["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"], description="Royal suite with Jacuzzi and separate living area."),
                Room(room_number="103", name="Family Standard", room_type=RoomType.standard, floor=1, base_price=3200, current_price=3200, capacity=4, size_sqft=350, amenities=["WiFi", "AC", "TV", "Extra Beds", "Safe"], images=["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"], description="Spacious family room with extra beds."),
                Room(room_number="203", name="Honeymoon Deluxe", room_type=RoomType.deluxe, floor=2, base_price=6000, current_price=6000, capacity=2, size_sqft=500, amenities=["WiFi", "AC", "Smart TV", "Mini Bar", "Rose Setup", "Champagne", "Jacuzzi", "Balcony"], images=["https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800"], description="Romantic honeymoon suite with special decorations."),
            ]
            db.add_all(rooms_data)

        if not db.query(Coupon).filter(Coupon.code == "WELCOME20").first():
            db.add(Coupon(code="WELCOME20", description="Welcome 20% off", discount_pct=20, max_discount=2000, min_booking_amount=3000, valid_until=datetime.utcnow() + timedelta(days=365), usage_limit=100, is_active=True))
        if not db.query(Coupon).filter(Coupon.code == "STAY10").first():
            db.add(Coupon(code="STAY10", description="Loyalty 10% off", discount_pct=10, max_discount=1000, min_booking_amount=2000, valid_until=datetime.utcnow() + timedelta(days=365), is_active=True))

        db.commit()
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "StaySync API v1.0 🏨", "docs": "/api/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
