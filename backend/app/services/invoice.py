import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime

INVOICE_DIR = "invoices"
os.makedirs(INVOICE_DIR, exist_ok=True)

PRIMARY = HexColor("#1B4F72")
ACCENT = HexColor("#2E86AB")
LIGHT = HexColor("#F4F6F8")
SUCCESS = HexColor("#27AE60")


def generate_invoice(booking, payment) -> str:
    filename = f"{INVOICE_DIR}/invoice_{booking.booking_ref}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("title", fontSize=24, textColor=PRIMARY, spaceAfter=4, fontName="Helvetica-Bold")
    subtitle_style = ParagraphStyle("subtitle", fontSize=10, textColor=ACCENT, spaceAfter=2)
    h2_style = ParagraphStyle("h2", fontSize=12, textColor=PRIMARY, fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=6)
    normal = ParagraphStyle("norm", fontSize=10, spaceAfter=4)
    right_style = ParagraphStyle("right", fontSize=10, alignment=TA_RIGHT)

    story = []

    # Header
    story.append(Paragraph("🏨 StaySync", title_style))
    story.append(Paragraph("Premium Hotel Management System", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY))
    story.append(Spacer(1, 0.3*cm))

    # Invoice info
    info_data = [
        ["INVOICE", f"#{booking.booking_ref}"],
        ["Date", datetime.utcnow().strftime("%d %B %Y")],
        ["Payment Status", "PAID ✓"],
    ]
    info_table = Table(info_data, colWidths=[4*cm, 6*cm])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, 0), PRIMARY),
        ("FONTSIZE", (1, 0), (1, 0), 14),
        ("FONTNAME", (1, 0), (1, 0), "Helvetica-Bold"),
        ("TEXTCOLOR", (1, 2), (1, 2), SUCCESS),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.5*cm))

    # Guest & Room Details
    story.append(Paragraph("Booking Details", h2_style))
    nights = (booking.check_out - booking.check_in).days
    details_data = [
        ["Guest", booking.user.name if hasattr(booking, 'user') and booking.user else "Guest"],
        ["Email", booking.user.email if hasattr(booking, 'user') and booking.user else ""],
        ["Room", booking.room.name if hasattr(booking, 'room') and booking.room else f"Room #{booking.room_id}"],
        ["Room Type", booking.room.room_type if hasattr(booking, 'room') and booking.room else ""],
        ["Check-in", booking.check_in.strftime("%d %B %Y, 2:00 PM")],
        ["Check-out", booking.check_out.strftime("%d %B %Y, 11:00 AM")],
        ["Nights", str(nights)],
        ["Guests", str(booking.guests)],
    ]
    det_table = Table(details_data, colWidths=[5*cm, 10*cm])
    det_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 0), (-1, -1), white),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E0E0E0")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(det_table)
    story.append(Spacer(1, 0.5*cm))

    # Billing
    story.append(Paragraph("Billing Summary", h2_style))
    price_per_night = booking.total_amount / nights if nights else booking.total_amount
    billing_data = [
        ["Description", "Amount"],
        [f"Room charges ({nights} nights × ₹{price_per_night:,.0f})", f"₹{booking.total_amount:,.2f}"],
        ["Discount", f"-₹{booking.discount_amount:,.2f}"],
        ["GST (18%)", f"₹{booking.gst_amount:,.2f}"],
        ["TOTAL AMOUNT", f"₹{booking.final_amount:,.2f}"],
    ]
    bill_table = Table(billing_data, colWidths=[10*cm, 5*cm])
    bill_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), ACCENT),
        ("TEXTCOLOR", (0, -1), (-1, -1), white),
        ("FONTSIZE", (0, -1), (-1, -1), 12),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#CCCCCC")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(bill_table)
    story.append(Spacer(1, 1*cm))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=LIGHT))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph("Thank you for choosing StaySync! We hope to see you again.", ParagraphStyle("footer", fontSize=9, textColor=HexColor("#888888"), alignment=TA_CENTER)))
    story.append(Paragraph("support@staysync.com | www.staysync.com | +91 98765 43210", ParagraphStyle("footer2", fontSize=8, textColor=HexColor("#AAAAAA"), alignment=TA_CENTER)))

    doc.build(story)
    return filename
