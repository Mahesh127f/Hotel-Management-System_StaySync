from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────────────────
class UserRole(str, Enum):
    admin = "admin"
    staff = "staff"
    customer = "customer"

class RoomType(str, Enum):
    standard = "standard"
    deluxe = "deluxe"
    suite = "suite"

class RoomStatus(str, Enum):
    available = "available"
    booked = "booked"
    cleaning = "cleaning"
    maintenance = "maintenance"

class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    checked_in = "checked_in"
    checked_out = "checked_out"
    cancelled = "cancelled"

class PaymentStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    refunded = "refunded"
    failed = "failed"

class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


# ─── Auth ─────────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.customer

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ─── Users ────────────────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    role: str
    loyalty_points: int
    is_active: bool
    avatar_url: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None


# ─── Rooms ────────────────────────────────────────────────────────────────────
class RoomCreate(BaseModel):
    room_number: str
    name: str
    room_type: RoomType
    floor: int = 1
    base_price: float
    capacity: int = 2
    size_sqft: Optional[int] = None
    amenities: List[str] = []
    images: List[str] = []
    description: Optional[str] = None

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    base_price: Optional[float] = None
    capacity: Optional[int] = None
    status: Optional[RoomStatus] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    description: Optional[str] = None

class RoomOut(BaseModel):
    id: int
    room_number: str
    name: str
    room_type: str
    floor: int
    base_price: float
    current_price: float
    capacity: int
    size_sqft: Optional[int]
    status: str
    amenities: List[Any]
    images: List[Any]
    description: Optional[str]
    avg_rating: Optional[float] = None
    model_config = {"from_attributes": True}


# ─── Bookings ─────────────────────────────────────────────────────────────────
class BookingCreate(BaseModel):
    room_id: int
    check_in: datetime
    check_out: datetime
    guests: int = 1
    coupon_code: Optional[str] = None
    special_requests: Optional[str] = None
    use_loyalty_points: bool = False

class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    special_requests: Optional[str] = None

class BookingOut(BaseModel):
    id: int
    booking_ref: str
    user_id: int
    room_id: int
    check_in: datetime
    check_out: datetime
    guests: int
    status: str
    total_amount: float
    discount_amount: float
    gst_amount: float
    final_amount: float
    coupon_code: Optional[str]
    qr_code_url: Optional[str]
    special_requests: Optional[str]
    created_at: datetime
    room: Optional[RoomOut] = None
    model_config = {"from_attributes": True}


# ─── Payments ─────────────────────────────────────────────────────────────────
class PaymentCreate(BaseModel):
    booking_id: int
    method: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    booking_id: int
    amount: float
    method: str
    status: str
    razorpay_order_id: Optional[str]
    invoice_url: Optional[str]
    paid_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Staff Tasks ──────────────────────────────────────────────────────────────
class TaskCreate(BaseModel):
    room_id: int
    staff_id: int
    task_type: str
    description: Optional[str] = None
    priority: str = "normal"
    scheduled_at: Optional[datetime] = None

class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    description: Optional[str] = None
    priority: Optional[str] = None

class TaskOut(BaseModel):
    id: int
    room_id: int
    staff_id: int
    task_type: str
    description: Optional[str]
    status: str
    priority: str
    scheduled_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    room: Optional[RoomOut] = None
    model_config = {"from_attributes": True}


# ─── Reviews ──────────────────────────────────────────────────────────────────
class ReviewCreate(BaseModel):
    room_id: int
    booking_id: Optional[int] = None
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

class ReviewOut(BaseModel):
    id: int
    user_id: int
    room_id: int
    rating: int
    comment: Optional[str]
    admin_response: Optional[str]
    created_at: datetime
    user: Optional[UserOut] = None
    model_config = {"from_attributes": True}


# ─── Notifications ────────────────────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Coupons ──────────────────────────────────────────────────────────────────
class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_pct: float
    max_discount: Optional[float] = None
    min_booking_amount: float = 0
    valid_until: Optional[datetime] = None
    usage_limit: Optional[int] = None

class CouponOut(BaseModel):
    id: int
    code: str
    description: Optional[str]
    discount_pct: float
    max_discount: Optional[float]
    min_booking_amount: float
    valid_until: Optional[datetime]
    usage_limit: Optional[int]
    used_count: int
    is_active: bool
    model_config = {"from_attributes": True}


# ─── Analytics ────────────────────────────────────────────────────────────────
class AnalyticsSummary(BaseModel):
    total_bookings: int
    total_revenue: float
    occupancy_rate: float
    avg_rating: float
    total_rooms: int
    available_rooms: int
    pending_tasks: int
    new_customers: int


# ─── Chatbot ──────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []
