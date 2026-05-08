// BookingDetail.jsx
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookingsAPI, paymentsAPI } from '../../services/api'
import { ChevronLeft, Calendar, Users, QrCode, Download, Loader2, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function BookingDetail() {
  const { id } = useParams()
  const { data: booking, isLoading } = useQuery({ queryKey: ['booking', id], queryFn: () => bookingsAPI.getOne(id).then(r => r.data) })
  const { data: payment } = useQuery({ queryKey: ['payment', id], queryFn: () => paymentsAPI.getByBooking(id).then(r => r.data), retry: false })

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (!booking) return <div className="text-center py-20"><h2 className="text-xl text-gray-600">Booking not found</h2></div>

  const nights = Math.max(1, (new Date(booking.check_out) - new Date(booking.check_in)) / 86400000)

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/my-bookings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <ChevronLeft size={16} />Back to Bookings
      </Link>
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Booking Details</h1>
            <p className="text-primary-600 dark:text-primary-400 font-mono font-bold text-lg mt-1">{booking.booking_ref}</p>
          </div>
          <span className={`badge text-sm px-3 py-1.5 capitalize ${booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : booking.status === 'checked_in' ? 'bg-green-100 text-green-700' : booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">Room Details</h3>
            <div className="space-y-2 text-sm">
              {[['Room', booking.room?.name || `Room #${booking.room_id}`], ['Type', booking.room?.room_type], ['Guests', `${booking.guests} guest(s)`]].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">Stay Details</h3>
            <div className="space-y-2 text-sm">
              {[['Check-in', format(new Date(booking.check_in), 'dd MMM yyyy')], ['Check-out', format(new Date(booking.check_out), 'dd MMM yyyy')], ['Duration', `${nights} night(s)`]].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {booking.special_requests && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Special Requests: </span>{booking.special_requests}
          </div>
        )}
      </div>

      {/* Billing */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Billing Summary</h3>
        <div className="space-y-2 text-sm">
          {[['Room Charges', `₹${booking.total_amount?.toLocaleString()}`], ['Discount', `-₹${booking.discount_amount?.toLocaleString()}`], ['GST (18%)', `₹${booking.gst_amount?.toLocaleString()}`]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>{k}</span><span>{v}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base border-t border-gray-100 dark:border-gray-800 pt-2 mt-1">
            <span>Total Paid</span>
            <span>₹{booking.final_amount?.toLocaleString()}</span>
          </div>
        </div>
        {payment?.status === 'paid' && (
          <a href={paymentsAPI.getInvoice(id)} target="_blank" rel="noreferrer"
            className="btn-secondary w-full text-center mt-4 flex items-center justify-center gap-2 text-sm py-2.5">
            <Download size={16} />Download Invoice (PDF)
          </a>
        )}
      </div>

      {/* QR Code */}
      {booking.qr_code_url && (
        <div className="card p-6 text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Check-in QR Code</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Show this at reception for quick check-in</p>
          <img src={booking.qr_code_url} alt="QR Code" className="w-40 h-40 mx-auto rounded-xl border-4 border-white dark:border-gray-800 shadow-md" />
        </div>
      )}
    </div>
  )
}
