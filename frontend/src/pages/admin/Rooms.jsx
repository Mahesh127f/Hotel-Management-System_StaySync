import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roomsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Loader2, BedDouble, X, Save } from 'lucide-react'

const AMENITIES_LIST = ['WiFi', 'AC', 'TV', 'Smart TV', 'Mini Bar', 'Mini Fridge', 'Room Service', 'Balcony', 'Bathtub', 'Jacuzzi', 'Safe', 'Hair Dryer', 'Breakfast', 'Butler Service', 'Kitchen', 'Living Room']

const emptyForm = { room_number: '', name: '', room_type: 'standard', floor: 1, base_price: '', capacity: 2, size_sqft: '', description: '', amenities: [], images: [''] }

export default function AdminRooms() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: rooms, isLoading } = useQuery({ queryKey: ['admin-rooms'], queryFn: () => roomsAPI.getAll().then(r => r.data) })

  const openCreate = () => { setForm(emptyForm); setEditing(null); setShowModal(true) }
  const openEdit = (room) => {
    setForm({ ...room, images: room.images?.length ? room.images : [''], amenities: room.amenities || [] })
    setEditing(room.id); setShowModal(true)
  }

  const save = useMutation({
    mutationFn: () => {
      const data = { ...form, base_price: parseFloat(form.base_price), capacity: parseInt(form.capacity), floor: parseInt(form.floor), size_sqft: form.size_sqft ? parseInt(form.size_sqft) : undefined, images: form.images.filter(Boolean) }
      return editing ? roomsAPI.update(editing, data) : roomsAPI.create(data)
    },
    onSuccess: () => { qc.invalidateQueries(['admin-rooms']); toast.success(editing ? 'Room updated!' : 'Room created!'); setShowModal(false) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed')
  })

  const del = useMutation({
    mutationFn: (id) => roomsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries(['admin-rooms']); toast.success('Room deleted') }
  })

  const toggleAmenity = (a) => setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }))
  const statusColors = { available: 'bg-green-100 text-green-700', booked: 'bg-red-100 text-red-700', cleaning: 'bg-orange-100 text-orange-700', maintenance: 'bg-gray-100 text-gray-600' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Room Management</h1>
          <p className="text-gray-500 text-sm mt-1">{rooms?.length || 0} rooms total</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} />Add Room</button>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {rooms?.map(room => (
            <div key={room.id} className="card overflow-hidden">
              <div className="relative">
                <img src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'} alt={room.name} className="w-full h-40 object-cover" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="badge bg-white/90 text-gray-700 capitalize text-xs font-semibold">{room.room_type}</span>
                  <span className={`badge ${statusColors[room.status] || statusColors.available} text-xs capitalize`}>{room.status}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{room.name}</h3>
                  <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">₹{room.current_price?.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">Room {room.room_number} · Floor {room.floor} · {room.capacity} guests</p>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(room)} className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1"><Pencil size={13} />Edit</button>
                  <button onClick={() => del.mutate(room.id)} className="btn-danger flex-1 text-xs py-1.5 flex items-center justify-center gap-1"><Trash2 size={13} />Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Room' : 'Add New Room'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Room Number*</label>
                  <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} className="input text-sm" placeholder="101" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Room Name*</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input text-sm" placeholder="Deluxe Garden View" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Room Type*</label>
                  <select value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))} className="input text-sm">
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Price/Night (₹)*</label>
                  <input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} className="input text-sm" placeholder="3000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Floor</label>
                  <input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} className="input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Capacity</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Size (sqft)</label>
                  <input type="number" value={form.size_sqft} onChange={e => setForm(f => ({ ...f, size_sqft: e.target.value }))} className="input text-sm" placeholder="350" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Image URLs</label>
                {form.images.map((img, i) => (
                  <input key={i} value={img} onChange={e => { const imgs = [...form.images]; imgs[i] = e.target.value; setForm(f => ({ ...f, images: imgs })) }}
                    className="input text-sm mb-2" placeholder="https://images.unsplash.com/..." />
                ))}
                <button type="button" onClick={() => setForm(f => ({ ...f, images: [...f.images, ''] }))} className="text-xs text-primary-600 hover:underline">+ Add image URL</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map(a => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.amenities.includes(a) ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => save.mutate()} disabled={save.isPending || !form.name || !form.base_price} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{editing ? 'Update Room' : 'Create Room'}
                </button>
                <button onClick={() => setShowModal(false)} className="btn-secondary px-6">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
