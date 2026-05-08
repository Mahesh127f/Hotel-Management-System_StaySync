import { Link } from 'react-router-dom'
import { Star, Users, Maximize, Wifi, BedDouble } from 'lucide-react'

const typeColors = {
  standard: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  deluxe: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  suite: 'bg-gold-400/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const statusColors = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  booked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cleaning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  maintenance: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export default function RoomCard({ room, showStatus = false }) {
  const img = room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative overflow-hidden">
        <img src={img} alt={room.name} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`badge ${typeColors[room.room_type] || typeColors.standard} capitalize font-semibold`}>
            {room.room_type}
          </span>
          {showStatus && (
            <span className={`badge ${statusColors[room.status] || statusColors.available} capitalize`}>
              {room.status}
            </span>
          )}
        </div>
        {room.avg_rating && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            {room.avg_rating}
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">{room.name}</h3>
          <p className="text-primary-600 dark:text-primary-400 font-bold text-lg ml-2 whitespace-nowrap">
            ₹{room.current_price?.toLocaleString()}
            <span className="text-xs text-gray-400 font-normal">/night</span>
          </p>
        </div>
        {room.base_price !== room.current_price && (
          <p className="text-xs text-gray-400 line-through mb-1">₹{room.base_price?.toLocaleString()}/night</p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{room.description}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <span className="flex items-center gap-1"><Users size={13} />{room.capacity} guests</span>
          {room.size_sqft && <span className="flex items-center gap-1"><Maximize size={13} />{room.size_sqft} sqft</span>}
          <span className="flex items-center gap-1"><Wifi size={13} />WiFi</span>
        </div>
        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {room.amenities?.slice(0, 4).map(a => (
            <span key={a} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{a}</span>
          ))}
          {room.amenities?.length > 4 && (
            <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">+{room.amenities.length - 4} more</span>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/rooms/${room.id}`} className="btn-secondary flex-1 text-center text-sm py-2">Details</Link>
          {room.status === 'available' && (
            <Link to={`/book/${room.id}`} className="btn-primary flex-1 text-center text-sm py-2">Book Now</Link>
          )}
        </div>
      </div>
    </div>
  )
}
