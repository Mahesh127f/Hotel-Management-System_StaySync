import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../../services/api'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, BedDouble, Users, Star, ClipboardList, IndianRupee, Loader2 } from 'lucide-react'

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

function StatCard({ icon: Icon, title, value, sub, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: summary, isLoading } = useQuery({ queryKey: ['analytics-summary'], queryFn: () => analyticsAPI.getSummary().then(r => r.data) })
  const { data: revenue } = useQuery({ queryKey: ['analytics-revenue'], queryFn: () => analyticsAPI.getRevenue('monthly').then(r => r.data) })
  const { data: byStatus } = useQuery({ queryKey: ['analytics-status'], queryFn: () => analyticsAPI.getBookingsByStatus().then(r => r.data) })
  const { data: topRooms } = useQuery({ queryKey: ['analytics-top'], queryFn: () => analyticsAPI.getTopRooms().then(r => r.data) })

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>

  const revenueData = revenue?.map(r => ({ ...r, date: r.date?.slice(0, 7) || r.date, revenue: Math.round(r.revenue) })) || []
  const statusData = byStatus?.map(s => ({ name: s.status.replace('_', ' '), value: s.count })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, Admin! Here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} title="Total Revenue" value={`₹${(summary?.total_revenue || 0).toLocaleString()}`} sub="All time" color="green" />
        <StatCard icon={BedDouble} title="Total Bookings" value={summary?.total_bookings || 0} sub={`${summary?.available_rooms} rooms available`} />
        <StatCard icon={TrendingUp} title="Occupancy Rate" value={`${summary?.occupancy_rate || 0}%`} sub={`${summary?.total_rooms} total rooms`} color="yellow" />
        <StatCard icon={Star} title="Avg Rating" value={`${summary?.avg_rating || 0}/5`} sub={`${summary?.new_customers} new customers`} color="purple" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Booking Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Performing Rooms</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topRooms || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={v => [v, 'Bookings']} />
              <Bar dataKey="bookings" fill="#2563EB" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Rooms', value: summary?.total_rooms, color: 'bg-blue-500' },
              { label: 'Available Now', value: summary?.available_rooms, color: 'bg-green-500' },
              { label: 'Pending Tasks', value: summary?.pending_tasks, color: 'bg-orange-500' },
              { label: 'New Customers', value: summary?.new_customers, color: 'bg-purple-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className={`w-2.5 h-10 ${color} rounded-full`} />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{value || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
