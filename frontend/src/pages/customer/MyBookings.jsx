// MyBookings.jsx
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsAPI } from '../../services/api'
import { CalendarDays, BedDouble, ChevronRight, Loader2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const statusColors = {
  pending: 'badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  checked_in: 'badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  checked_out: 'badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function MyBookings() {
  const qc = useQueryClient()
  const { data: bookings, isLoading } = useQuery({ queryKey: ['my-bookings'], queryFn: () => bookingsAPI.getAll().then(r => r.data) })

  const cancel = useMutation({
    mutationFn: (id) => bookingsAPI.cancel(id),
    onSuccess: () => { qc.invalidateQueries(['my-bookings']); toast.success('Booking cancelled') },
    onError: () => toast.error('Could not cancel booking'),
  })

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{bookings?.length || 0} booking(s) found</p>
        </div>
        <Link to="/rooms" className="btn-primary text-sm py-2 px-4">Book New Room</Link>
      </div>

      {!bookings?.length ? (
        <div className="card p-12 text-center">
          <BedDouble size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No bookings yet</h3>
          <p className="text-gray-400 mb-6 text-sm">Start by browsing our available rooms</p>
          <Link to="/rooms" className="btn-primary inline-block">Browse Rooms</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const nights = Math.max(1, (new Date(b.check_out) - new Date(b.check_in)) / 86400000)
            return (
              <div key={b.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {b.room?.images?.[0] && (
                    <img src={b.room.images[0]} alt={b.room?.name} className="w-full sm:w-24 h-32 sm:h-20 object-cover rounded-xl shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{b.room?.name || `Room #${b.room_id}`}</h3>
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-mono font-bold">{b.booking_ref}</p>
                      </div>
                      <span className={statusColors[b.status] || 'badge bg-gray-100 text-gray-600'}>{b.status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><CalendarDays size={13} />{format(new Date(b.check_in), 'dd MMM')} → {format(new Date(b.check_out), 'dd MMM yyyy')}</span>
                      <span>{nights} night{nights > 1 ? 's' : ''} · {b.guests} guest{b.guests > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">₹{b.final_amount?.toLocaleString()}</span>
                      <div className="flex gap-2">
                        {b.status === 'confirmed' && (
                          <button onClick={() => cancel.mutate(b.id)} disabled={cancel.isPending}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2.5 py-1.5 rounded-lg transition-colors">
                            <XCircle size={12} />Cancel
                          </button>
                        )}
                        <Link to={`/my-bookings/${b.id}`} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-2.5 py-1.5 rounded-lg transition-colors">
                          Details <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
