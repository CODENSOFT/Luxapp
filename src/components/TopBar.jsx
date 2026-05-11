import { Menu } from 'lucide-react'

export default function TopBar({ title, onMenuClick }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200">
      <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700">
        <Menu size={22} />
      </button>
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
    </header>
  )
}
