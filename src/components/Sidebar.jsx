import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, GitBranch, Settings, TrendingUp, X } from 'lucide-react'

const linkuri = [
  { to: '/', icon: LayoutDashboard, eticheta: 'Panou Principal' },
  { to: '/transactions', icon: ArrowLeftRight, eticheta: 'Tranzacții' },
  { to: '/branches', icon: GitBranch, eticheta: 'Filiale' },
  { to: '/settings', icon: Settings, eticheta: 'Setări' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-30 w-64 flex flex-col
        bg-white border-r border-gray-200
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={22} />
            <span className="font-semibold text-gray-900 text-lg">FinanceHub</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {linkuri.map(({ to, icon: Icon, eticheta }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {eticheta}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
