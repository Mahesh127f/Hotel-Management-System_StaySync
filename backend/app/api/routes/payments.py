from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
from app.db.database import get_db
from app.models.models import Payment, Booking, PaymentStatus
from app.schemas.schemas import PaymentCreate, PaymentOut
from app.core.security import get_current_user
from app.services.invoice import generate_invoice

router = APIRouter()


@router.post("/create-order")
async def create_order(booking_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {
        "order_id": f"order_demo_{booking_id}",
        "amount": booking.final_amount,
        "currency": "INR",
        "key_id": "rzp_test_demo"
    }


@router.post("/verify", response_model=PaymentOut)
async def verify_payment(data: PaymentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    existing = db.query(Payment).filter(Payment.booking_id == data.booking_id).first()
    if existing:
        return existing

    payment = Payment(
        booking_id=data.booking_id,
        amount=booking.final_amount,
        method=data.method,
        status=PaymentStatus.paid,
        razorpay_order_id=f"order_demo_{data.booking_id}",
        razorpay_payment_id=f"pay_demo_{data.booking_id}",
        transaction_id=f"TXN{booking.booking_ref}",
        paid_at=datetime.utcnow()
    )
    db.add(payment)
    db.flush()

    try:
        invoice_path = generate_invoice(booking, payment)
        payment.invoice_url = invoice_path
    except Exception:
        pass

    db.commit()
    db.refresh(payment)
    return payment


@router.get("/{booking_id}/invoice")
async def get_invoice(booking_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()
    if not payment or not payment.invoice_url:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if os.path.exists(payment.invoice_url):
        return FileResponse(payment.invoice_url, media_type="application/pdf", filename=f"invoice_{booking_id}.pdf")
    raise HTTPException(status_code=404, detail="Invoice file not found")


@router.get("/booking/{booking_id}", response_model=PaymentOut)
async def get_payment(booking_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment