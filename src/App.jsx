import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Incarcare from './components/Incarcare'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Branches from './pages/Branches'
import Settings from './pages/Settings'
import { useApp } from './context/AppContext'

function Continut() {
  const { loading, eroare } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (eroare) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 max-w-md text-sm">
          <p className="font-bold mb-1">Eroare la conectare</p>
          <p>{eroare}</p>
        </div>
      </div>
    )
  }

  if (loading) return <Incarcare />

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

export default function App() {
  return <Continut />
}
