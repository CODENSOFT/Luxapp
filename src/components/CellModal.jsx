import { useState } from 'react'
import { X, Plus, Trash2, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'

function emptyExp() {
  return { _id: Math.random(), amount: '', category: '', comentariu: '' }
}

export default function CellModal({ date, branch, onClose }) {
  const { getEntry, saveEntry, categories } = useApp()
  const existing = getEntry(date, branch)

  const [incasare, setIncasare] = useState(existing?.incasare > 0 ? String(existing.incasare) : '')
  const [expenses, setExpenses] = useState(
    existing?.expenses?.length
      ? existing.expenses.map(e => ({ ...e, _id: Math.random() }))
      : [emptyExp()]
  )
  const [saving, setSaving] = useState(false)

  function setExp(id, field, value) {
    setExpenses(prev => prev.map(e => e._id === id ? { ...e, [field]: value } : e))
  }

  const totalAvans = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const totalNet = (parseFloat(incasare) || 0) - totalAvans

  async function handleSave() {
    setSaving(true)
    const cleanExp = expenses
      .filter(e => parseFloat(e.amount) >= 0)
      .map(({ _id, ...e }) => ({ ...e, amount: parseFloat(e.amount) }))
    await saveEntry(date, branch, parseFloat(incasare) || 0, cleanExp)
    setSaving(false)
    onClose()
  }

  const inputCls = "w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-400">{date}</p>
            <p className="text-sm font-bold text-gray-900">{branch}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Încasare */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Încasare (MDL)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={incasare}
              onChange={e => setIncasare(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>

          {/* Expenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Cheltuieli / Avans
              </label>
              <button
                onClick={() => setExpenses(prev => [...prev, emptyExp()])}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <Plus size={12} /> Adaugă rând
              </button>
            </div>

            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-[80px_1fr_1fr_20px] gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">
                <span>Sumă</span>
                <span>Categorie</span>
                <span>Comentariu</span>
                <span />
              </div>

              {expenses.map(exp => (
                <div key={exp._id} className="grid grid-cols-[80px_1fr_1fr_20px] gap-1.5 items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={exp.amount}
                    onChange={e => setExp(exp._id, 'amount', e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
                  />
                  <select
                    value={exp.category}
                    onChange={e => setExp(exp._id, 'category', e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">—</option>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Notă…"
                    value={exp.comentariu}
                    onChange={e => setExp(exp._id, 'comentariu', e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={() => setExpenses(prev => prev.filter(e => e._id !== exp._id))}
                    className="text-gray-300 hover:text-red-500 transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-0.5">
              <div>Avans total: <span className="font-semibold text-red-600">{totalAvans.toFixed(2)} MDL</span></div>
            </div>
            <div className={`text-base font-bold ${totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalNet >= 0 ? '+' : ''}{totalNet.toFixed(2)} MDL
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
            Anulează
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Check size={15} />
            {saving ? 'Se salvează…' : 'Salvează'}
          </button>
        </div>
      </div>
    </div>
  )
}
