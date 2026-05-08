import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '../../services/api'
import { Loader2, UserCheck, UserX, Shield, User, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const roleColors = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  staff: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  customer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersAPI.getAll().then(r => r.data)
  })

  const toggle = useMutation({
    mutationFn: (id) => usersAPI.toggleActive(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User status updated') }
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>

  const admins = users?.filter(u => u.role === 'admin').length || 0
  const staff = users?.filter(u => u.role === 'staff').length || 0
  const customers = users?.filter(u => u.role === 'customer').length || 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">{users?.length || 0} total users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ['Admins', admins, Shield, 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'],
          ['Staff', staff, User, 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'],
          ['Customers', customers, Users, 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'],
        ].map(([label, count, Icon, cls]) => (
          <div key={label} className="card p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cls}`}>
              <Icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {['User', 'Email', 'Phone', 'Role', 'Loyalty Pts', 'Joined', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {users?.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge capitalize text-xs ${roleColors[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">{u.loyalty_points}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle.mutate(u.id)}
                      disabled={u.role === 'admin' || toggle.isPending}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        u.is_active
                          ? 'text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10'
                          : 'text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/10'
                      }`}
                    >
                      {u.is_active ? <><UserX size={12} />Disable</> : <><UserCheck size={12} />Enable</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
