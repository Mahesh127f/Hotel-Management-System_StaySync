import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { roomsAPI } from '../../services/api'
import RoomCard from '../../components/common/RoomCard'
import { Search, SlidersHorizontal, BedDouble, Loader2 } from 'lucide-react'

export default function Rooms() {
  const [filters, setFilters] = useState({ room_type: '', min_price: '', max_price: '', capacity: '' })
  const [showFilters, setShowFilters] = useState(false)

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', filters],
    queryFn: () => roomsAPI.getAll(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))).then(r => r.data)
  })

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters({ room_type: '', min_price: '', max_price: '', capacity: '' })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Our Rooms</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Choose from our collection of {rooms?.length || 0} stunning rooms</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
            <SlidersHorizontal size={18} />Filters
          </div>
          <div className="flex gap-2">
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Clear all</button>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary text-xs py-1.5 px-3 md:hidden">
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 ${showFilters ? '' : 'hidden md:grid'}`}>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Room Type</label>
            <select value={filters.room_type} onChange={e => setFilter('room_type', e.target.value)} className="input text-sm py-2">
              <option value="">All Types</option>
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Min Price (₹)</label>
            <input type="number" value={filters.min_price} onChange={e => setFilter('min_price', e.target.value)}
              placeholder="0" className="input text-sm py-2" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Max Price (₹)</label>
            <input type="number" value={filters.max_price} onChange={e => setFilter('max_price', e.target.value)}
              placeholder="20000" className="input text-sm py-2" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Guests</label>
            <select value={filters.capacity} onChange={e => setFilter('capacity', e.target.value)} className="input text-sm py-2">
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room Type Quick Filter */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {['', 'standard', 'deluxe', 'suite'].map(t => (
          <button key={t} onClick={() => setFilter('room_type', t)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.room_type === t ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-400'}`}>
            {t === '' ? 'All Rooms' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      ) : !rooms?.length ? (
        <div className="text-center py-20">
          <BedDouble size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No rooms found</h3>
          <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => <RoomCard key={room.id} room={room} />)}
        </div>
      )}
    </div>
  )
}
