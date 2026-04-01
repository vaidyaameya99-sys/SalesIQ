import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload, Clock, BookOpen, Settings, Zap, BarChart2
} from 'lucide-react'

const NAV = [
  { to: '/upload',    label: 'Analyze',  icon: Upload    },
  { to: '/history',   label: 'History',  icon: Clock     },
  { to: '/knowledge', label: 'Knowledge',icon: BookOpen  },
  { to: '/settings',  label: 'Settings', icon: Settings  },
]

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-cyan flex items-center justify-center">
            <Zap size={16} className="text-dark-900 fill-current" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Sales<span className="text-accent-cyan">IQ</span>
          </span>
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-white/8'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* CTA */}
        <button
          onClick={() => navigate('/upload')}
          className="btn-primary text-xs py-2 px-4"
        >
          <BarChart2 size={14} />
          New Analysis
        </button>
      </div>
    </header>
  )
}
