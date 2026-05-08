import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsAPI } from '../../services/api'
import { useAuthStore } from '../../store'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const ref = useRef(null)
  const qc = useQueryClient()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll().then(r => r.data),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries(['notifications'])
  })

  const markAll = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => qc.invalidateQueries(['notifications'])
  })

  const unread = data?.filter(n => !n.is_read).length || 0

  if (!isAuthenticated) return null

  const typeColors = {
    success: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    info: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 card shadow-xl z-50 max-h-[480px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                <CheckCheck size={12} />Mark all read
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {!data?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
            ) : (
              data.slice(0, 20).map(n => (
                <div key={n.id} className={`p-3 mx-3 my-2 rounded-xl border text-sm cursor-pointer ${typeColors[n.notification_type] || typeColors.info} ${!n.is_read ? 'font-medium' : 'opacity-70'}`}
                  onClick={() => !n.is_read && markRead.mutate(n.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-gray-800 dark:text-gray-100">{n.title}</p>
                    {!n.is_read && <div className="w-2 h-2 bg-primary-600 rounded-full shrink-0 mt-1" />}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-0.5 text-xs">{n.message}</p>
                  <p className="text-gray-400 text-xs mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
