import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffAPI } from '../../services/api'
import { Loader2, CheckCircle, Clock, AlertCircle, Play } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const statusConfig = {
  pending: { color: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertCircle },
  in_progress: { color: 'border-blue-300 bg-blue-50 dark:bg-blue-900/10', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
  completed: { color: 'border-green-300 bg-green-50 dark:bg-green-900/10', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
}

const priorityColors = { high: 'bg-red-100 text-red-700', normal: 'bg-gray-100 text-gray-600', low: 'bg-gray-50 text-gray-400' }

export default function StaffTasks() {
  const qc = useQueryClient()
  const { data: tasks, isLoading } = useQuery({ queryKey: ['my-tasks'], queryFn: () => staffAPI.getTasks().then(r => r.data) })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => staffAPI.updateTask(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['my-tasks']); toast.success('Task updated!') }
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>

  const pending = tasks?.filter(t => t.status === 'pending') || []
  const inProgress = tasks?.filter(t => t.status === 'in_progress') || []
  const completed = tasks?.filter(t => t.status === 'completed') || []

  const TaskCard = ({ task }) => {
    const cfg = statusConfig[task.status] || statusConfig.pending
    const Icon = cfg.icon
    return (
      <div className={`card border-l-4 ${cfg.color} p-4`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white capitalize">{task.task_type}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{task.room?.name || `Room #${task.room_id}`}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`badge text-xs capitalize ${cfg.badge} flex items-center gap-1`}>
              <Icon size={10} />{task.status.replace('_', ' ')}
            </span>
            <span className={`badge text-xs capitalize ${priorityColors[task.priority]}`}>{task.priority}</span>
          </div>
        </div>
        {task.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{task.description}</p>}
        {task.scheduled_at && (
          <p className="text-xs text-gray-400 mb-3">📅 {format(new Date(task.scheduled_at), 'dd MMM, h:mm a')}</p>
        )}
        <div className="flex gap-2">
          {task.status === 'pending' && (
            <button onClick={() => updateStatus.mutate({ id: task.id, status: 'in_progress' })}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors font-medium">
              <Play size={12} />Start Task
            </button>
          )}
          {task.status === 'in_progress' && (
            <button onClick={() => updateStatus.mutate({ id: task.id, status: 'completed' })}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg transition-colors font-medium">
              <CheckCircle size={12} />Mark Complete
            </button>
          )}
          {task.status === 'completed' && (
            <div className="flex-1 text-center text-xs text-green-600 dark:text-green-400 font-semibold py-2">✓ Completed</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">{tasks?.length || 0} total tasks assigned to you</p>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Pending', tasks: pending, color: 'bg-yellow-500' },
          { title: 'In Progress', tasks: inProgress, color: 'bg-blue-500' },
          { title: 'Completed', tasks: completed, color: 'bg-green-500' },
        ].map(({ title, tasks: columnTasks, color }) => (
          <div key={title}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{columnTasks.length}</span>
            </div>
            <div className="space-y-3">
              {columnTasks.map(task => <TaskCard key={task.id} task={task} />)}
              {!columnTasks.length && (
                <div className="card p-6 text-center text-gray-400 text-sm border-2 border-dashed dark:border-gray-800">
                  No {title.toLowerCase()} tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
