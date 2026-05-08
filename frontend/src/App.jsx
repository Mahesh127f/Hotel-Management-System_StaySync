import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore, useThemeStore } from './store'

// Layouts
import AdminLayout from './components/layouts/AdminLayout'
import StaffLayout from './components/layouts/StaffLayout'
import CustomerLayout from './components/layouts/CustomerLayout'
import PublicLayout from './components/layouts/PublicLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Customer Pages
import Home from './pages/customer/Home'
import Rooms from './pages/customer/Rooms'
import RoomDetail from './pages/customer/RoomDetail'
import BookRoom from './pages/customer/BookRoom'
import MyBookings from './pages/customer/MyBookings'
import BookingDetail from './pages/customer/BookingDetail'
import Profile from './pages/customer/Profile'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminRooms from './pages/admin/Rooms'
import AdminBookings from './pages/admin/Bookings'
import AdminStaff from './pages/admin/Staff'
import AdminUsers from './pages/admin/Users'
import AdminReviews from './pages/admin/Reviews'
import AdminCoupons from './pages/admin/Coupons'
import AdminAnalytics from './pages/admin/Analytics'

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard'
import StaffTasks from './pages/staff/Tasks'

// Protected Route
function Protected({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { init } = useThemeStore()
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer */}
        <Route element={<Protected roles={['customer', 'admin', 'staff']}><CustomerLayout /></Protected>}>
          <Route path="/book/:roomId" element={<BookRoom />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/my-bookings/:id" element={<BookingDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Admin */}
        <Route element={<Protected roles={['admin']}><AdminLayout /></Protected>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/rooms" element={<AdminRooms />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>

        {/* Staff */}
        <Route element={<Protected roles={['staff', 'admin']}><StaffLayout /></Protected>}>
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/tasks" element={<StaffTasks />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
