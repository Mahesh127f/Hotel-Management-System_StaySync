# 🏨 StaySync — Hotel Management System

> Full-stack web app built with React + FastAPI + PostgreSQL  
> Amity University, B.Tech IT — Semester 5 Project

---

## 🚀 Quick Start (Run Locally in 5 Minutes)

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL installed and running

---

## Step 1 — Create PostgreSQL Database

Open pgAdmin or psql and run:
```sql
CREATE DATABASE staysync;
```

---

## Step 2 — Backend Setup

```powershell
# Go into backend folder
cd staysync/backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file (already created — just verify DATABASE_URL)
# Edit .env and set your PostgreSQL password if needed
# Default: postgresql://postgres:password@localhost:5432/staysync

# Run the server
uvicorn app.main:app --reload --port 8000
```

✅ Backend will auto-create all tables and seed demo data on first run.

Visit: http://localhost:8000/api/docs to see all API endpoints.

---

## Step 3 — Frontend Setup

Open a **new terminal**:

```powershell
cd staysync/frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Visit: http://localhost:5173

---

## 🔑 Demo Login Credentials

| Role     | Email                     | Password      |
|----------|---------------------------|---------------|
| 👑 Admin  | admin@staysync.com        | admin123      |
| 🧹 Staff  | staff@staysync.com        | staff123      |
| 🛎️ Guest  | customer@staysync.com     | customer123   |

---

## 🎟️ Demo Coupons

| Code       | Discount       |
|------------|----------------|
| WELCOME20  | 20% off (max ₹2000) |
| STAY10     | 10% off (max ₹1000) |

---

## 📁 Project Structure

```
staysync/
├── backend/
│   ├── app/
│   │   ├── api/routes/      ← All API endpoints
│   │   ├── core/            ← JWT, config, security
│   │   ├── db/              ← Database connection
│   │   ├── models/          ← SQLAlchemy DB models
│   │   ├── schemas/         ← Pydantic validation
│   │   └── services/        ← Business logic (pricing, invoice)
│   ├── invoices/            ← Generated PDF invoices
│   ├── requirements.txt
│   ├── .env
│   └── main.py (entry point — run this)
│
└── frontend/
    ├── src/
    │   ├── components/      ← Shared UI components
    │   ├── pages/           ← All page components
    │   │   ├── admin/       ← Dashboard, Rooms, Staff, Analytics...
    │   │   ├── auth/        ← Login, Register
    │   │   ├── customer/    ← Home, Rooms, Booking, Profile
    │   │   └── staff/       ← Dashboard, Tasks
    │   ├── services/api.js  ← All Axios API calls
    │   └── store/index.js   ← Zustand state (auth, theme)
    ├── .env
    └── vercel.json
```

---

## 🌐 Deploy to Production

### Frontend → Vercel
1. Push code to GitHub
2. Go to vercel.com → New Project → Import repo
3. Set root directory to `frontend`
4. Add env variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy!

### Backend → Render
1. Go to render.com → New Web Service
2. Connect GitHub repo, set root to `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env variables from `.env`

### Database → Supabase
1. Create free account at supabase.com
2. New Project → get connection string
3. Update `DATABASE_URL` in Render env vars

---

## ✨ Features

| Feature | Status |
|---------|--------|
| JWT Auth (Admin/Staff/Customer) | ✅ |
| Room Management (CRUD + Images) | ✅ |
| Real-time Availability | ✅ |
| Booking System + QR Code | ✅ |
| Razorpay Payment Integration | ✅ |
| PDF Invoice Generation | ✅ |
| GST Calculation (18%) | ✅ |
| Dynamic Pricing (weekend/occupancy) | ✅ |
| Admin Analytics Dashboard | ✅ |
| Staff & Housekeeping Tasks | ✅ |
| AI Chatbot (Groq LLaMA) | ✅ |
| Loyalty Points System | ✅ |
| Coupon / Discount Codes | ✅ |
| Review & Feedback System | ✅ |
| In-app Notifications | ✅ |
| Dark Mode | ✅ |
| Mobile Responsive (PWA) | ✅ |
| Recommendation Engine | ✅ |

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Query, Zustand, Recharts, Framer Motion  
**Backend:** FastAPI, SQLAlchemy, Alembic, Pydantic v2  
**Database:** PostgreSQL  
**Auth:** JWT (python-jose + bcrypt)  
**Payments:** Razorpay  
**AI:** Groq LLaMA 3.3  
**PDF:** ReportLab  
**Deploy:** Vercel (frontend) + Render (backend) + Supabase (DB)

---

## 👨‍💻 Developed By

**Mahesh Yadav**  
B.Tech Information Technology — Batch 2023–27  
Amity University Uttar Pradesh (ASET)

---

*StaySync © 2024 — Semester 5 Academic Project*
