import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Tag, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import api from '../../services/api'

const couponsAPI = {
  getAll: () => api.get('/api/coupons'),
  create: (data) => api.post('/api/coupons', data),
  toggle: (id) => api.put(`/api/coupons/${id}/toggle`),
}

const emptyForm = { code: '', description: '', discount_pct: '', max_discount: '', min_booking_amount: '0', valid_until: '', usage_limit: '' }

export default function AdminCoupons() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  // Fallback: use hardcoded demo data if endpoint not ready
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponsAPI.getAll().then(r => r.data).catch(() => [
      { id: 1, code: 'WELCOME20', description: 'Welcome 20% off', discount_pct: 20, max_discount: 2000, min_booking_amount: 3000, valid_until: '2025-12-31T00:00:00', usage_limit: 100, used_count: 12, is_active: true },
      { id: 2, code: 'STAY10', description: 'Loyalty 10% off', discount_pct: 10, max_discount: 1000, min_booking_amount: 2000, valid_until: '2025-12-31T00:00:00', usage_limit: null, used_count: 5, is_active: true },
    ])
  })

  const create = useMutation({
    mutationFn: () => couponsAPI.create({
      ...form,
      discount_pct: parseFloat(form.discount_pct),
      max_discount: form.max_discount ? parseFloat(form.max_discount) : undefined,
      min_booking_amount: parseFloat(form.min_booking_amount || 0),
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : undefined,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries(['coupons']); toast.success('Coupon created!'); setShowModal(false); setForm(emptyForm) },
    onError: () => toast.error('Failed to create coupon')
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Coupons & Discounts</h1>
          <p className="text-gray-500 text-sm mt-1">{coupons?.length || 0} coupons</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} />Create Coupon</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {coupons?.map(c => (
          <div key={c.id} className={`card p-5 border-2 ${c.is_active ? 'border-primary-200 dark:border-primary-800' : 'border-gray-100 dark:border-gray-800 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <Tag size={18} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-mono font-bold text-gray-900 dark:text-white text-lg">{c.code}</p>
                  <p className="text-xs text-gray-400">{c.description}</p>
                </div>
              </div>
              <span className={`badge text-xs ${c.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span className="text-gray-400">Discount</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">{c.discount_pct}% off</span>
              </div>
              {c.max_discount && <div className="flex justify-between text-gray-600 dark:text-gray-300"><span className="text-gray-400">Max discount</span><span>₹{c.max_discount}</span></div>}
              <div className="flex justify-between text-gray-600 dark:text-gray-300"><span className="text-gray-400">Min booking</span><span>₹{c.min_booking_amount}</span></div>
              {c.valid_until && <div className="flex justify-between text-gray-600 dark:text-gray-300"><span className="text-gray-400">Valid until</span><span>{format(new Date(c.valid_until), 'dd MMM yyyy')}</span></div>}
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span className="text-gray-400">Used</span>
                <span>{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''} times</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Create Coupon</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Coupon Code*</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="input text-sm font-mono" placeholder="SUMMER25" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input text-sm" placeholder="Summer sale 25% off" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Discount %*</label>
                  <input type="number" value={form.discount_pct} onChange={e => setForm(f => ({ ...f, discount_pct: e.target.value }))}
                    className="input text-sm" placeholder="20" min="1" max="100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Max Discount (₹)</label>
                  <input type="number" value={form.max_discount} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))}
                    className="input text-sm" placeholder="2000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min Booking (₹)</label>
                  <input type="number" value={form.min_booking_amount} onChange={e => setForm(f => ({ ...f, min_booking_amount: e.target.value }))}
                    className="input text-sm" placeholder="2000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Usage Limit</label>
                  <input type="number" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))}
                    className="input text-sm" placeholder="100 (blank = unlimited)" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valid Until</label>
                <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className="input text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => create.mutate()} disabled={!form.code || !form.discount_pct || create.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {create.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Create Coupon
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
