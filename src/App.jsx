import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Branches from './pages/Branches'
import Settings from './pages/Settings'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard onMenuClick={() => setSidebarOpen(true)} />} />
          <Route path="/transactions" element={<Transactions onMenuClick={() => setSidebarOpen(true)} />} />
          <Route path="/branches" element={<Branches onMenuClick={() => setSidebarOpen(true)} />} />
          <Route path="/settings" element={<Settings onMenuClick={() => setSidebarOpen(true)} />} />
        </Routes>
      </main>
    </div>
  )
}
