# staff.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.models.models import StaffTask, User, Room, RoomStatus, Notification
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskOut
from app.core.security import get_current_user, require_role

router = APIRouter()


@router.get("/tasks", response_model=List[TaskOut])
async def get_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(StaffTask).order_by(StaffTask.created_at.desc()).all()
    return db.query(StaffTask).filter(StaffTask.staff_id == current_user.id).order_by(StaffTask.created_at.desc()).all()


@router.post("/tasks", response_model=TaskOut)
async def create_task(data: TaskCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    task = StaffTask(**data.model_dump(), assigned_by=current_user.id)
    db.add(task)
    db.add(Notification(
        user_id=data.staff_id,
        title="New Task Assigned",
        message=f"You have a new {data.task_type} task for Room {data.room_id}",
        notification_type="info"
    ))
    db.commit()
    db.refresh(task)
    return task


@router.put("/tasks/{task_id}", response_model=TaskOut)
async def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    task = db.query(StaffTask).filter(StaffTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(task, k, v)
    if data.status == "completed":
        task.completed_at = datetime.utcnow()
        room = db.query(Room).filter(Room.id == task.room_id).first()
        if room:
            room.status = RoomStatus.available
    db.commit()
    db.refresh(task)
    return task


@router.get("/members")
async def get_staff(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    staff = db.query(User).filter(User.role == "staff", User.is_active == True).all()
    return [{"id": s.id, "name": s.name, "email": s.email, "phone": s.phone} for s in staff]
