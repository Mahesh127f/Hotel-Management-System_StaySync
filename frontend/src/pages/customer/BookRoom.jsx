import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { roomsAPI, bookingsAPI, paymentsAPI } from '../../services/api'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'
import { ChevronLeft, Calendar, Users, Tag, Award, Loader2, CheckCircle } from 'lucide-react'

const GST = 0.18

export default function BookRoom() {
  const { roomId } = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=details, 2=payment, 3=success
  const [booking, setBooking] = useState(null)
  const [form, setForm] = useState({
    check_in: '', check_out: '', guests: 1, coupon_code: '', special_requests: '', use_loyalty_points: false, payment_method: 'razorpay'
  })

  const { data: room } = useQuery({ queryKey: ['room', roomId], queryFn: () => roomsAPI.getOne(roomId).then(r => r.data) })

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const nights = form.check_in && form.check_out
    ? Math.max(0, (new Date(form.check_out) - new Date(form.check_in)) / 86400000)
    : 0

  const subtotal = (room?.current_price || 0) * nights
  const gst = subtotal * GST
  const total = subtotal + gst

  const createBooking = useMutation({
    mutationFn: () => bookingsAPI.create({
      room_id: parseInt(roomId),
      check_in: new Date(form.check_in).toISOString(),
      check_out: new Date(form.check_out).toISOString(),
      guests: parseInt(form.guests),
      coupon_code: form.coupon_code || undefined,
      special_requests: form.special_requests || undefined,
      use_loyalty_points: form.use_loyalty_points,
    }),
    onSuccess: async (res) => {
      setBooking(res.data)
      // Create payment record
      try {
        await paymentsAPI.verify({ booking_id: res.data.id, method: form.payment_method })
      } catch {}
      setStep(3)
      toast.success('Booking confirmed! 🎉')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Booking failed')
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to={`/rooms/${roomId}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <ChevronLeft size={16} />Back to Room
      </Link>

      {step === 3 ? (
        // Success
        <div className="card p-10 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed! 🎉</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">Booking Reference: <span className="font-bold text-primary-600">{booking?.booking_ref}</span></p>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">A confirmation has been added to your bookings.</p>
          {booking?.qr_code_url && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">Your Check-in QR Code</p>
              <img src={booking.qr_code_url} alt="QR Code" className="w-32 h-32 mx-auto rounded-xl" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/my-bookings" className="btn-primary flex-1 text-center">View My Bookings</Link>
            <Link to="/rooms" className="btn-secondary flex-1 text-center">Browse More Rooms</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6">Complete Your Booking</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      <Calendar size={14} className="inline mr-1" />Check-in Date
                    </label>
                    <input type="date" required value={form.check_in} min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      <Calendar size={14} className="inline mr-1" />Check-out Date
                    </label>
                    <input type="date" required value={form.check_out} min={form.check_in || new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <Users size={14} className="inline mr-1" />Number of Guests
                  </label>
                  <select value={form.guests} onChange={e => setForm(f => ({ ...f, guests: e.target.value }))} className="input">
                    {Array.from({ length: room?.capacity || 4 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <Tag size={14} className="inline mr-1" />Coupon Code (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input value={form.coupon_code} onChange={e => setForm(f => ({ ...f, coupon_code: e.target.value.toUpperCase() }))}
                      placeholder="e.g. WELCOME20" className="input" />
                  </div>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">Try: WELCOME20 (20% off) or STAY10 (10% off)</p>
                </div>
                {user?.loyalty_points >= 100 && (
                  <div className="flex items-center gap-3 p-3 bg-gold-400/10 border border-gold-400/30 rounded-xl">
                    <Award size={18} className="text-gold-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Use Loyalty Points</p>
                      <p className="text-xs text-gray-500">{user.loyalty_points} pts = ₹{Math.floor(user.loyalty_points / 100) * 50} discount</p>
                    </div>
                    <input type="checkbox" checked={form.use_loyalty_points}
                      onChange={e => setForm(f => ({ ...f, use_loyalty_points: e.target.checked }))}
                      className="w-5 h-5 accent-primary-600" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Special Requests</label>
                  <textarea value={form.special_requests} onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))}
                    placeholder="E.g. early check-in, extra pillows, anniversary decoration..." rows={3} className="input resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[['razorpay', '💳 Razorpay'], ['upi', '📱 UPI'], ['cash', '💵 Cash']].map(([v, l]) => (
                      <button key={v} type="button" onClick={() => setForm(f => ({ ...f, payment_method: v }))}
                        className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${form.payment_method === v ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => createBooking.mutate()}
                disabled={!form.check_in || !form.check_out || nights <= 0 || createBooking.isPending}
                className="btn-primary w-full py-3 mt-6 flex items-center justify-center gap-2">
                {createBooking.isPending ? <><Loader2 size={18} className="animate-spin" />Processing...</> : `Confirm Booking — ₹${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="card p-5 sticky top-24">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Booking Summary</h3>
              {room?.images?.[0] && <img src={room.images[0]} alt={room.name} className="w-full h-36 object-cover rounded-xl mb-4" />}
              <p className="font-semibold text-gray-900 dark:text-white">{room?.name}</p>
              <p className="text-sm text-gray-500 capitalize mb-4">{room?.room_type} · Floor {room?.floor}</p>
              <div className="space-y-2 text-sm border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>₹{room?.current_price?.toLocaleString()} × {nights} nights</span>
                  <span>₹{subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                  <span>Total</span>
                  <span>₹{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">🔒 Secure payment · Free cancellation 24hr before</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
