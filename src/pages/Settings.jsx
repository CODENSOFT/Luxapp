import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'

function ListaEtichete({ items, onRemove }) {
  const [confirmItem, setConfirmItem] = useState(null)
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map(item => (
        <span key={item} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm">
          {item}
          {confirmItem === item ? (
            <>
              <button
                onClick={() => { onRemove(item); setConfirmItem(null) }}
                className="text-red-500 hover:text-red-700 font-medium text-xs ml-1"
              >
                Șterge?
              </button>
              <button onClick={() => setConfirmItem(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </>
          ) : (
            <button
              onClick={() => setConfirmItem(item)}
              className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
            >
              <Trash2 size={13} />
            </button>
          )}
        </span>
      ))}
      {items.length === 0 && <p className="text-sm text-gray-400 mt-1">Niciun element adăugat.</p>}
    </div>
  )
}

function FormularAdaugare({ placeholder, onAdd }) {
  const [value, setValue] = useState('')
  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) { onAdd(trimmed); setValue('') }
  }
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        type="text"
        className="flex-1 rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
        <Plus size={15} />
        Adaugă
      </button>
    </form>
  )
}

export default function Settings({ onMenuClick }) {
  const { branches, categories, addBranch, removeBranch, addCategory, removeCategory } = useApp()

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Setări" onMenuClick={onMenuClick} />

      <div className="p-6 space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900">Filiale</h2>
          <p className="text-sm text-gray-500 mt-1">Gestionați lista de filiale disponibile în aplicație.</p>
          <ListaEtichete items={branches} onRemove={removeBranch} />
          <FormularAdaugare placeholder="Nume filială nouă…" onAdd={addBranch} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900">Categorii</h2>
          <p className="text-sm text-gray-500 mt-1">Gestionați categoriile de venituri și cheltuieli.</p>
          <ListaEtichete items={categories} onRemove={removeCategory} />
          <FormularAdaugare placeholder="Nume categorie nouă…" onAdd={addCategory} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900">Baza de Date</h2>
          <p className="text-sm text-gray-500 mt-1">
            Datele sunt salvate în cloud și sincronizate în timp real pe toate dispozitivele.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-sm text-green-700 font-medium">Conectat la Supabase</span>
          </div>
        </div>
      </div>
    </div>
  )
}
