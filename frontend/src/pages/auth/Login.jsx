import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { BedDouble, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      login(data.user, data.access_token)
      toast.success(`Welcome back, ${data.user.name}! 🎉`)
      if (data.user.role === 'admin') navigate('/admin')
      else if (data.user.role === 'staff') navigate('/staff')
      else navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = async (email, password) => {
    setForm({ email, password })
    setLoading(true)
    try {
      const { data } = await authAPI.login({ email, password })
      login(data.user, data.access_token)
      toast.success(`Logged in as ${data.user.role}!`)
      if (data.user.role === 'admin') navigate('/admin')
      else if (data.user.role === 'staff') navigate('/staff')
      else navigate('/')
    } catch { toast.error('Demo login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <BedDouble size={24} className="text-white" />
            </div>
            <span className="font-display font-bold text-3xl text-white">StaySync</span>
          </Link>
          <p className="text-primary-200 mt-2 text-sm">Sign in to your account</p>
        </div>

        {/* Demo Accounts */}
        <div className="bg-white/10 rounded-2xl p-4 mb-6 backdrop-blur">
          <p className="text-white/80 text-xs font-semibold mb-3 uppercase tracking-wide">Quick Demo Login</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '👑 Admin', email: 'admin@staysync.com', pass: 'admin123' },
              { label: '🧹 Staff', email: 'staff@staysync.com', pass: 'staff123' },
              { label: '🛎️ Guest', email: 'customer@staysync.com', pass: 'customer123' },
            ].map(d => (
              <button key={d.label} onClick={() => demoLogin(d.email, d.pass)}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors">
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className="input pr-11" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={18} className="animate-spin" />Signing in...</> : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
