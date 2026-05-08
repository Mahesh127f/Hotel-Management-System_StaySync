import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsAPI } from '../../services/api'
import { Star, MessageSquare, EyeOff, Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminReviews() {
  const qc = useQueryClient()
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => reviewsAPI.getAll().then(r => r.data)
  })

  const respond = useMutation({
    mutationFn: ({ id, text }) => reviewsAPI.respond(id, text),
    onSuccess: () => { qc.invalidateQueries(['admin-reviews']); toast.success('Response posted'); setReplyingTo(null); setReplyText('') }
  })

  const hide = useMutation({
    mutationFn: (id) => reviewsAPI.hide(id),
    onSuccess: () => { qc.invalidateQueries(['admin-reviews']); toast.success('Review hidden') }
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>

  const avgRating = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Reviews & Feedback</h1>
          <p className="text-gray-500 text-sm mt-1">{reviews?.length || 0} reviews · Avg {avgRating} ⭐</p>
        </div>
        <div className="flex items-center gap-2 card px-4 py-2">
          <Star size={18} className="text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-gray-900 dark:text-white text-lg">{avgRating}</span>
          <span className="text-gray-400 text-sm">/ 5</span>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Rating Distribution</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews?.filter(r => r.rating === star).length || 0
            const pct = reviews?.length ? (count / reviews.length) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-4">{star}</span>
                <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-gray-400 w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews?.map(r => (
          <div key={r.id} className="card p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
                  {r.user?.name?.[0]?.toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.user?.name || 'Guest'}</p>
                  <p className="text-xs text-gray-400">{format(new Date(r.created_at), 'dd MMM yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700'} />
                  ))}
                </div>
                <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs">Room #{r.room_id}</span>
              </div>
            </div>

            {r.comment && <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm leading-relaxed">{r.comment}</p>}

            {r.admin_response && (
              <div className="mt-3 pl-4 border-l-2 border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10 rounded-r-xl p-3">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-1">Management Response</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{r.admin_response}</p>
              </div>
            )}

            {replyingTo === r.id && (
              <div className="mt-3 flex gap-2">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  rows={2} placeholder="Write your response..." className="input text-sm resize-none flex-1" />
                <div className="flex flex-col gap-2">
                  <button onClick={() => respond.mutate({ id: r.id, text: replyText })} disabled={!replyText.trim() || respond.isPending}
                    className="btn-primary text-xs px-3 py-2 flex items-center gap-1">
                    <Send size={12} />Post
                  </button>
                  <button onClick={() => setReplyingTo(null)} className="btn-secondary text-xs px-3 py-2">Cancel</button>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {!r.admin_response && (
                <button onClick={() => { setReplyingTo(r.id); setReplyText('') }}
                  className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1.5 rounded-lg transition-colors">
                  <MessageSquare size={12} />Reply
                </button>
              )}
              <button onClick={() => hide.mutate(r.id)}
                className="flex items-center gap-1 text-xs text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors">
                <EyeOff size={12} />Hide
              </button>
            </div>
          </div>
        ))}

        {!reviews?.length && (
          <div className="card p-12 text-center">
            <Star size={40} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
