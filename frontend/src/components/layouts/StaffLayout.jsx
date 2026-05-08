// StaffLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, useThemeStore } from '../../store'
import { LayoutDashboard, ClipboardList, LogOut, Moon, Sun } from 'lucide-react'
import NotificationBell from '../common/NotificationBell'

export default function StaffLayout() {
  const { user, logout } = useAuthStore()
  const { isDark, toggle } = useThemeStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-4">
        <div className="font-display font-bold text-lg text-primary-700 dark:text-primary-400">StaySync Staff</div>
        <nav className="flex gap-2 flex-1">
          <NavLink to="/staff" end className={({ isActive }) => `sidebar-link px-3 py-2 text-sm ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={16} />Dashboard
          </NavLink>
          <NavLink to="/staff/tasks" className={({ isActive }) => `sidebar-link px-3 py-2 text-sm ${isActive ? 'active' : ''}`}>
            <ClipboardList size={16} />Tasks
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">{user?.name}</span>
          <NotificationBell />
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => { logout(); navigate('/login') }} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="p-4 md:p-6">
        <div className="page-enter"><Outlet /></div>
      </main>
    </div>
  )
}
