// RoomDetail.jsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { roomsAPI, reviewsAPI } from '../../services/api'
import { Star, Users, Maximize, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function RoomDetail() {
  const { id } = useParams()
  const [imgIdx, setImgIdx] = useState(0)

  const { data: room, isLoading } = useQuery({ queryKey: ['room', id], queryFn: () => roomsAPI.getOne(id).then(r => r.data) })
  const { data: reviews } = useQuery({ queryKey: ['reviews', id], queryFn: () => reviewsAPI.getRoomReviews(id).then(r => r.data) })

  if (isLoading) return <div className="flex items-center justify-center py-40"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (!room) return <div className="text-center py-20"><h2 className="text-xl font-semibold text-gray-600">Room not found</h2></div>

  const images = room.images?.length ? room.images : ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800']

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <ChevronLeft size={16} />Back to Rooms
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images & Details */}
        <div className="lg:col-span-2">
          <div className="relative rounded-2xl overflow-hidden mb-3 h-72 sm:h-96">
            <img src={images[imgIdx]} alt={room.name} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4">
              <span className="badge bg-white/90 text-gray-700 font-semibold capitalize">{room.room_type}</span>
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
              {images.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setImgIdx(i)}
                  className={`w-20 h-16 object-cover rounded-lg cursor-pointer shrink-0 transition-all ${i === imgIdx ? 'ring-2 ring-primary-600 opacity-100' : 'opacity-60 hover:opacity-100'}`} />
              ))}
            </div>
          )}
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">{room.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span className="flex items-center gap-1"><Users size={14} />{room.capacity} guests max</span>
            {room.size_sqft && <span className="flex items-center gap-1"><Maximize size={14} />{room.size_sqft} sqft</span>}
            {room.avg_rating && <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" />{room.avg_rating} ({reviews?.length} reviews)</span>}
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">{room.description}</p>

          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Amenities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {room.amenities?.map(a => (
              <div key={a} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle size={16} className="text-green-500 shrink-0" />{a}
              </div>
            ))}
          </div>

          {/* Reviews */}
          {reviews?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Guest Reviews ({reviews.length})</h3>
              <div className="space-y-4">
                {reviews.slice(0, 5).map(r => (
                  <div key={r.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                        {r.user?.name?.[0] || 'G'}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{r.user?.name || 'Guest'}</span>
                      <div className="flex ml-auto">
                        {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>
                    {r.admin_response && (
                      <div className="mt-2 pl-3 border-l-2 border-primary-300 text-xs text-gray-500 dark:text-gray-400 italic">
                        <span className="font-semibold text-primary-600 not-italic">Management reply: </span>{r.admin_response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Card */}
        <div>
          <div className="card p-6 sticky top-24">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
              ₹{room.current_price?.toLocaleString()}
              <span className="text-base font-normal text-gray-400">/night</span>
            </div>
            {room.base_price !== room.current_price && (
              <p className="text-sm text-gray-400 line-through mb-2">₹{room.base_price?.toLocaleString()}/night (dynamic pricing)</p>
            )}
            <div className="flex items-center gap-1 mb-6">
              {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(room.avg_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}
              <span className="text-sm text-gray-500 ml-1">({reviews?.length || 0} reviews)</span>
            </div>
            <div className="space-y-3 mb-6 text-sm">
              {[['Room Type', room.room_type?.toUpperCase()], ['Floor', `Floor ${room.floor}`], ['Capacity', `Up to ${room.capacity} guests`], ['Status', room.status]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium capitalize">{v}</span>
                </div>
              ))}
            </div>
            {room.status === 'available' ? (
              <Link to={`/book/${room.id}`} className="btn-primary w-full text-center py-3 block">Book This Room</Link>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center py-3 rounded-xl text-sm font-semibold">
                Currently {room.status}
              </div>
            )}
            <p className="text-xs text-gray-400 text-center mt-3">Free cancellation 24 hours before check-in</p>
          </div>
        </div>
      </div>
    </div>
  )
}
