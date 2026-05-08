import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../../services/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Loader2, TrendingUp, IndianRupee, Users, BedDouble } from 'lucide-react'

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('monthly')

  const { data: summary } = useQuery({ queryKey: ['analytics-summary'], queryFn: () => analyticsAPI.getSummary().then(r => r.data) })
  const { data: revenue, isLoading } = useQuery({ queryKey: ['analytics-revenue', period], queryFn: () => analyticsAPI.getRevenue(period).then(r => r.data) })
  const { data: byStatus } = useQuery({ queryKey: ['analytics-status'], queryFn: () => analyticsAPI.getBookingsByStatus().then(r => r.data) })
  const { data: topRooms } = useQuery({ queryKey: ['analytics-top'], queryFn: () => analyticsAPI.getTopRooms().then(r => r.data) })
  const { data: customerStats } = useQuery({ queryKey: ['analytics-customers'], queryFn: () => analyticsAPI.getCustomerStats().then(r => r.data) })

  const revenueData = revenue?.map(r => ({ ...r, date: r.date?.slice(0, 7) || r.date, revenue: Math.round(r.revenue || 0) })) || []
  const statusData = byStatus?.map(s => ({ name: s.status.replace('_', ' '), value: s.count })) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Comprehensive hotel performance metrics</p>
        </div>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${period === p ? 'bg-primary-600 text-white' : 'btn-secondary py-2'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${(summary?.total_revenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
          { label: 'Total Bookings', value: summary?.total_bookings || 0, icon: BedDouble, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400' },
          { label: 'Occupancy Rate', value: `${summary?.occupancy_rate || 0}%`, icon: TrendingUp, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400' },
          { label: 'Total Customers', value: customerStats?.total_customers || 0, icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend ({period})</h3>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} labelStyle={{ fontWeight: 600 }} />
              <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Booking Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine fontSize={11}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Rooms */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Rooms by Bookings</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topRooms || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
              <Tooltip formatter={v => [v, 'Bookings']} />
              <Bar dataKey="bookings" fill="#2563EB" radius={[0, 6, 6, 0]}>
                {(topRooms || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Customer Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            ['Total Customers', customerStats?.total_customers, 'bg-primary-600'],
            ['New This Month', customerStats?.new_this_month, 'bg-green-500'],
            ['Returning Customers', customerStats?.returning, 'bg-purple-500'],
          ].map(([label, value, color]) => (
            <div key={label} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className={`w-3 h-12 ${color} rounded-full`} />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
