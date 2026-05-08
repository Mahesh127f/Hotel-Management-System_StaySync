import { useState } from 'react'
import { useAuthStore } from '../../store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { usersAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Award, Loader2, Save } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [editing, setEditing] = useState(false)

  const update = useMutation({
    mutationFn: () => usersAPI.updateProfile(form),
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile updated!'); setEditing(false) },
    onError: () => toast.error('Update failed')
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"><User size={14} className="inline mr-1" />Full Name</label>
            <input value={form.name} disabled={!editing} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={`input ${!editing ? 'opacity-70 cursor-not-allowed' : ''}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"><Mail size={14} className="inline mr-1" />Email</label>
            <input value={user?.email} disabled className="input opacity-70 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"><Phone size={14} className="inline mr-1" />Phone</label>
            <input value={form.phone} disabled={!editing} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className={`input ${!editing ? 'opacity-70 cursor-not-allowed' : ''}`} placeholder="+91 98765 43210" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {editing ? (
            <>
              <button onClick={() => update.mutate()} disabled={update.isPending} className="btn-primary flex items-center gap-2">
                {update.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Save Changes
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-secondary">Edit Profile</button>
          )}
        </div>
      </div>

      {/* Loyalty Points */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gold-400/20 rounded-xl flex items-center justify-center">
            <Award size={20} className="text-gold-500" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Loyalty Points</h3>
        </div>
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gold-400/10 to-primary-600/10 rounded-2xl border border-gold-400/20">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{user?.loyalty_points || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Points Available</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
              ₹{Math.floor((user?.loyalty_points || 0) / 100) * 50}
            </p>
            <p className="text-xs text-gray-400">Redeemable value</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">Earn 10 points for every ₹100 spent. 100 pts = ₹50 discount.</p>
      </div>
    </div>
  )
}
