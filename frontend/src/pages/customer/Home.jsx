import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { roomsAPI } from '../../services/api'
import { Star, Shield, Wifi, Coffee, MapPin, ChevronRight, BedDouble, Award, Clock } from 'lucide-react'
import RoomCard from '../../components/common/RoomCard'

export default function Home() {
  const { data: rooms } = useQuery({ queryKey: ['rooms-featured'], queryFn: () => roomsAPI.getAll().then(r => r.data) })

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80" alt="Hotel" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-500/40 rounded-full px-4 py-1.5 mb-6">
              <Award size={14} className="text-gold-400" />
              <span className="text-gold-300 text-sm font-medium">Premium Hotel Experience</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Welcome to <span className="text-primary-400">StaySync</span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl mb-8 leading-relaxed">
              Experience luxury redefined. Smart hotel management, seamless bookings, and unforgettable stays — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/rooms" className="btn-primary text-base py-3 px-8 flex items-center justify-center gap-2">
                <BedDouble size={18} />Browse Rooms
              </Link>
              <Link to="/register" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold py-3 px-8 rounded-xl transition-all text-center">
                Create Account
              </Link>
            </div>
            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-12">
              {[['500+', 'Happy Guests'], ['8', 'Room Types'], ['4.9★', 'Avg Rating'], ['24/7', 'Support']].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-bold text-white">{v}</div>
                  <div className="text-gray-400 text-sm">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Why Choose StaySync?</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3">Everything you need for a perfect stay</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Wifi, title: 'Free High-Speed WiFi', desc: 'Stay connected with blazing fast internet throughout the property' },
              { icon: Shield, title: 'Secure Payments', desc: 'Bank-level encryption with Razorpay integration for safe transactions' },
              { icon: Coffee, title: 'Room Service 24/7', desc: 'Premium dining delivered to your door anytime you want' },
              { icon: Clock, title: 'Smart Check-in', desc: 'QR code-based seamless check-in, no waiting at reception' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={24} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Featured Rooms</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Hand-picked selections for your comfort</p>
            </div>
            <Link to="/rooms" className="hidden sm:flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold hover:underline text-sm">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.slice(0, 6).map(room => <RoomCard key={room.id} room={room} />)}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link to="/rooms" className="btn-secondary inline-flex items-center gap-2">View All Rooms <ChevronRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* Loyalty Program */}
      <section className="py-16 bg-primary-700 dark:bg-primary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Award size={40} className="text-gold-400 mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold text-white mb-4">StaySync Loyalty Rewards</h2>
          <p className="text-primary-200 text-lg mb-8">Earn 10 points for every ₹100 spent. Redeem for free nights, upgrades, and exclusive perks!</p>
          <div className="grid grid-cols-3 gap-6 mb-10">
            {[['Earn Points', 'Get 10 pts per ₹100 on every booking'], ['Redeem', '100 pts = ₹50 discount on next stay'], ['Exclusive Perks', 'Priority check-in & room upgrades']].map(([t, d]) => (
              <div key={t} className="bg-white/10 rounded-2xl p-4">
                <div className="font-bold text-white mb-1 text-sm sm:text-base">{t}</div>
                <div className="text-primary-200 text-xs sm:text-sm">{d}</div>
              </div>
            ))}
          </div>
          <Link to="/register" className="bg-white text-primary-700 font-bold py-3 px-8 rounded-xl hover:bg-primary-50 transition-colors inline-block">
            Join Now — It's Free!
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Book Your Stay?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Use code <span className="font-bold text-primary-600 dark:text-primary-400">WELCOME20</span> for 20% off your first booking!</p>
          <Link to="/rooms" className="btn-primary text-base py-3 px-10 inline-flex items-center gap-2">
            <BedDouble size={18} />Book Now
          </Link>
        </div>
      </section>
    </div>
  )
}
