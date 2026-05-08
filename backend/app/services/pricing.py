from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import PricingRule, Room, RoomStatus


def calculate_dynamic_price(base_price: float, check_in: datetime | None, db: Session) -> float:
    if not check_in:
        return base_price

    price = base_price
    rules = db.query(PricingRule).filter(PricingRule.is_active == True).all()

    for rule in rules:
        if rule.rule_type == "weekend" and check_in.weekday() >= 4:  # Fri-Sun
            price *= rule.multiplier
        elif rule.rule_type == "occupancy":
            total = db.query(Room).filter(Room.is_active == True).count()
            booked = db.query(Room).filter(Room.status == RoomStatus.booked).count()
            occupancy = (booked / total * 100) if total else 0
            if occupancy >= (rule.condition_value or 80):
                price *= rule.multiplier
        elif rule.rule_type == "last_minute":
            hours_until = (check_in.replace(tzinfo=None) - datetime.utcnow()).total_seconds() / 3600
            if hours_until <= 24:
                price *= rule.multiplier

    return round(price, 2)


def seed_pricing_rules(db: Session):
    """Seed default pricing rules if none exist"""
    if db.query(PricingRule).count() == 0:
        rules = [
            PricingRule(rule_name="Weekend Surcharge", rule_type="weekend", multiplier=1.15, is_active=True),
            PricingRule(rule_name="High Occupancy", rule_type="occupancy", condition_value=80.0, multiplier=1.20, is_active=True),
            PricingRule(rule_name="Last Minute Deal", rule_type="last_minute", multiplier=0.90, is_active=True),
        ]
        db.add_all(rules)
        db.commit()
