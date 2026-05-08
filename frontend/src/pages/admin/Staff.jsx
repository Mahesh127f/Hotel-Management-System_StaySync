import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffAPI, roomsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Loader2, X, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

const statusColors = { pending: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' }
const StatusIcon = ({ s }) => s === 'completed' ? <CheckCircle size={14} className="text-green-500" /> : s === 'in_progress' ? <Clock size={14} className="text-blue-500" /> : <AlertCircle size={14} className="text-yellow-500" />

export default function AdminStaff() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ room_id: '', staff_id: '', task_type: 'cleaning', description: '', priority: 'normal', scheduled_at: '' })

  const { data: tasks, isLoading } = useQuery({ queryKey: ['admin-tasks'], queryFn: () => staffAPI.getTasks().then(r => r.data) })
  const { data: members } = useQuery({ queryKey: ['staff-members'], queryFn: () => staffAPI.getMembers().then(r => r.data) })
  const { data: rooms } = useQuery({ queryKey: ['admin-rooms'], queryFn: () => roomsAPI.getAll().then(r => r.data) })

  const create = useMutation({
    mutationFn: () => staffAPI.createTask({ ...form, room_id: parseInt(form.room_id), staff_id: parseInt(form.staff_id), scheduled_at: form.scheduled_at || undefined }),
    onSuccess: () => { qc.invalidateQueries(['admin-tasks']); toast.success('Task assigned!'); setShowModal(false) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed')
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => staffAPI.updateTask(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['admin-tasks']); toast.success('Status updated') }
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>

  const pending = tasks?.filter(t => t.status === 'pending').length || 0
  const inProgress = tasks?.filter(t => t.status === 'in_progress').length || 0
  const completed = tasks?.filter(t => t.status === 'completed').length || 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Staff & Housekeeping</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks?.length || 0} total tasks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} />Assign Task</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[['Pending', pending, 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'], ['In Progress', inProgress, 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'], ['Completed', completed, 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400']].map(([l, v, c]) => (
          <div key={l} className={`rounded-2xl p-4 ${c}`}>
            <div className="text-2xl font-bold">{v}</div>
            <div className="text-sm font-medium">{l}</div>
          </div>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {['Room', 'Task', 'Assigned To', 'Priority', 'Scheduled', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {tasks?.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.room?.name || `Room #${t.room_id}`}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{t.task_type}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">Staff #{t.staff_id}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs capitalize ${t.priority === 'high' ? 'bg-red-100 text-red-700' : t.priority === 'low' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.scheduled_at ? format(new Date(t.scheduled_at), 'dd MMM, h:mm a') : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs capitalize flex items-center gap-1 w-fit ${statusColors[t.status]}`}>
                      <StatusIcon s={t.status} />{t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={t.status} onChange={e => updateStatus.mutate({ id: t.id, status: e.target.value })}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {['pending','in_progress','completed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Assign Task</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Room*</label>
                <select value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))} className="input text-sm">
                  <option value="">Select Room</option>
                  {rooms?.map(r => <option key={r.id} value={r.id}>{r.name} ({r.room_number})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Assign To*</label>
                <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} className="input text-sm">
                  <option value="">Select Staff</option>
                  {members?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Task Type</label>
                  <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))} className="input text-sm">
                    {['cleaning','maintenance','setup','inspection'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input text-sm">
                    {['low','normal','high'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input text-sm resize-none" placeholder="Task details..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Scheduled Date & Time</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="input text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => create.mutate()} disabled={!form.room_id || !form.staff_id || create.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {create.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}Assign Task
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
