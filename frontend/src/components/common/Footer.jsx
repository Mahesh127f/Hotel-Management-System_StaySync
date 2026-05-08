// Footer.jsx
import { Link } from 'react-router-dom'
import { BedDouble, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <BedDouble size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">StaySync</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">Premium hotel management system delivering exceptional hospitality experiences.</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[['/', 'Home'], ['/rooms', 'Rooms'], ['/login', 'Login'], ['/register', 'Register']].map(([to, label]) => (
              <li key={to}><Link to={to} className="hover:text-primary-400 transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Room Types</h4>
          <ul className="space-y-2 text-sm">
            {['Standard Rooms', 'Deluxe Rooms', 'Luxury Suites', 'Honeymoon Suite'].map(t => (
              <li key={t} className="text-gray-400">{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><MapPin size={14} className="text-primary-400 shrink-0" />123 Hotel Street, Mumbai, India</li>
            <li className="flex items-center gap-2"><Phone size={14} className="text-primary-400 shrink-0" />+91 98765 43210</li>
            <li className="flex items-center gap-2"><Mail size={14} className="text-primary-400 shrink-0" />support@staysync.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} StaySync. All rights reserved. Built with ❤️ for Amity University.
      </div>
    </footer>
  )
}

export default Footer
