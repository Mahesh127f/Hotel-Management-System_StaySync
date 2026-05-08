// Staff Dashboard
import { useQuery } from '@tanstack/react-query'
import { staffAPI } from '../../services/api'
import { useAuthStore } from '../../store'
import { CheckCircle, Clock, AlertCircle, ClipboardList } from 'lucide-react'

export function StaffDashboard() {
  const { user } = useAuthStore()
  const { data: tasks } = useQuery({ queryKey: ['my-tasks'], queryFn: () => staffAPI.getTasks().then(r => r.data) })

  const pending = tasks?.filter(t => t.status === 'pending').length || 0
  const inProgress = tasks?.filter(t => t.status === 'in_progress').length || 0
  const completed = tasks?.filter(t => t.status === 'completed').length || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name}! 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's your task overview for today</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          ['Pending', pending, AlertCircle, 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'],
          ['In Progress', inProgress, Clock, 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'],
          ['Completed', completed, CheckCircle, 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'],
        ].map(([label, count, Icon, cls]) => (
          <div key={label} className="card p-5 text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${cls}`}>
              <Icon size={22} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{count}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">My Recent Tasks</h3>
        {!tasks?.length ? (
          <div className="text-center py-8">
            <ClipboardList size={36} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks?.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className={`w-2 h-8 rounded-full shrink-0 ${t.status === 'completed' ? 'bg-green-500' : t.status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm capitalize">{t.task_type}</p>
                  <p className="text-xs text-gray-400">{t.room?.name || `Room #${t.room_id}`}</p>
                </div>
                <span className={`badge text-xs capitalize ${t.priority === 'high' ? 'bg-red-100 text-red-700' : t.priority === 'low' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>{t.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffDashboard
