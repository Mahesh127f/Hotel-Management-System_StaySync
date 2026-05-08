// Admin Bookings page
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsAPI } from '../../services/api'
import { format } from 'date-fns'
import { Loader2, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'

const statusColors = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', checked_in: 'bg-green-100 text-green-700', checked_out: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-700' }

export default function AdminBookings() {
  const qc = useQueryClient()
  const { data: bookings, isLoading } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => bookingsAPI.getAll().then(r => r.data) })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => bookingsAPI.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['admin-bookings']); toast.success('Status updated') }
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">{bookings?.length || 0} total bookings</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {['Ref', 'Guest', 'Room', 'Check-in', 'Check-out', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {bookings?.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600">{b.booking_ref}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">Guest #{b.user_id}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.room?.name || `Room #${b.room_id}`}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(b.check_in), 'dd MMM yy')}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(b.check_out), 'dd MMM yy')}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">₹{b.final_amount?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge capitalize text-xs ${statusColors[b.status] || 'bg-gray-100 text-gray-700'}`}>{b.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={b.status} onChange={e => updateStatus.mutate({ id: b.id, status: e.target.value })}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {['pending','confirmed','checked_in','checked_out','cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
