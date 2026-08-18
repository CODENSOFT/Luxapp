import { useState } from 'react'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'
import DeleteCodeModal from '../components/DeleteCodeModal'

/** Listă ordonabilă de filiale: săgeți sus/jos (mobil) + drag & drop (desktop).
 *  Ordinea salvată aici este ordinea coloanelor din tabelul lunar. */
function ListaFilialeOrdonate({ items, onRemove, onMove, onReorder }) {
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  function handleDrop(to) {
    const from = dragIndex
    setDragIndex(null)
    setOverIndex(null)
    if (from === null || from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next)
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-400 mt-3">Nicio filială adăugată.</p>
  }

  return (
    <>
      {deleteTarget && (
        <DeleteCodeModal
          onConfirm={() => { onRemove(deleteTarget); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <ul className="mt-3 flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li
            key={item}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={e => { e.preventDefault(); setOverIndex(i) }}
            onDragLeave={() => setOverIndex(prev => (prev === i ? null : prev))}
            onDrop={e => { e.preventDefault(); handleDrop(i) }}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
            className={`flex items-center gap-2 rounded-lg border bg-gray-50 px-2.5 py-2 transition-colors ${
              dragIndex === i
                ? 'opacity-50 border-blue-300'
                : overIndex === i
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200'
            }`}
          >
            <GripVertical size={15} className="shrink-0 text-gray-300 cursor-grab active:cursor-grabbing" />
            <span className="w-5 shrink-0 text-center text-xs font-semibold text-gray-400 tabular-nums">{i + 1}</span>
            <span className="flex-1 min-w-0 truncate text-sm text-gray-800">{item}</span>

            <button
              type="button"
              title="Mută mai sus"
              disabled={i === 0}
              onClick={() => onMove(i, -1)}
              className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              <ChevronUp size={15} />
            </button>
            <button
              type="button"
              title="Mută mai jos"
              disabled={i === items.length - 1}
              onClick={() => onMove(i, 1)}
              className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              <ChevronDown size={15} />
            </button>
            <button
              type="button"
              title="Șterge filiala"
              onClick={() => setDeleteTarget(item)}
              className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </>
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
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4" autoComplete="off">
      <input
        type="text"
        className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        autoComplete="off"
      />
      <button type="submit" className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
        <Plus size={15} />
        <span className="hidden sm:inline">Adaugă</span>
      </button>
    </form>
  )
}

export default function Settings({ onMenuClick }) {
  const { branches, addBranch, removeBranch, moveBranch, reorderBranches } = useApp()

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Setări" onMenuClick={onMenuClick} />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900">Filiale</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestionați lista de filiale. Ordinea de aici este ordinea coloanelor din tabel —
            trageți rândurile sau folosiți săgețile.
          </p>
          <ListaFilialeOrdonate
            items={branches}
            onRemove={removeBranch}
            onMove={moveBranch}
            onReorder={reorderBranches}
          />
          <FormularAdaugare placeholder="Nume filială nouă…" onAdd={addBranch} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900">Baza de Date</h2>
          <p className="text-sm text-gray-500 mt-1">
            Datele sunt salvate în cloud și sincronizate în timp real pe toate dispozitivele.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
            <span className="text-sm text-green-700 font-medium">Conectat la Supabase</span>
          </div>
        </div>
      </div>
    </div>
  )
}
