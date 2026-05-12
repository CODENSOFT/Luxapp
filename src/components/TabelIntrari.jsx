import { useState } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { today } from '../utils/dateUtils'

const TIPURI = ['Încasare', 'Avans', 'Cheltuială']

function emptyRow() {
  return { _id: Math.random(), branch: '', tip: 'Încasare', category: '', amount: '', comentarii: '' }
}

export default function TabelIntrari({ onClose }) {
  const { branches, categories, saveEntry } = useApp()
  const [date, setDate] = useState(today())
  const [rows, setRows] = useState(() => Array.from({ length: 3 }, emptyRow))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setCell(id, field, value) {
    setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r))
    setError('')
  }

  function deleteRow(id) {
    setRows(prev => prev.length > 1 ? prev.filter(r => r._id !== id) : prev)
  }

  async function handleSave() {
    const filled = rows.filter(r => r.branch && parseFloat(r.amount) > 0)
    if (filled.length === 0) {
      setError('Adăugați cel puțin un rând cu filială și sumă.')
      return
    }

    // Group by branch
    const byBranch = {}
    for (const r of filled) {
      if (!byBranch[r.branch]) byBranch[r.branch] = { incasare: 0, expenses: [] }
      const amount = parseFloat(r.amount) || 0
      if (r.tip === 'Încasare') {
        byBranch[r.branch].incasare += amount
      } else {
        byBranch[r.branch].expenses.push({ amount, category: r.category, comentariu: r.comentarii })
      }
    }

    setSaving(true)
    for (const [branch, { incasare, expenses }] of Object.entries(byBranch)) {
      await saveEntry(date, branch, incasare, expenses)
    }
    setSaving(false)
    onClose()
  }

  const inputCls = "w-full bg-white rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Adaugă Tranzacții</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Date picker */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 shrink-0">Data:</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: 680 }}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-8 text-center">#</th>
                  <th className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-left w-40">Filială</th>
                  <th className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-left w-32">Tip</th>
                  <th className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-left w-36">Categorie</th>
                  <th className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-right w-28">Sumă (MDL)</th>
                  <th className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-left">Comentarii</th>
                  <th className="border border-gray-200 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const showCat = row.tip === 'Avans' || row.tip === 'Cheltuială'
                  return (
                    <tr key={row._id} className="hover:bg-gray-50/60">
                      <td className="border border-gray-200 px-2 py-1.5 text-xs text-gray-400 text-center font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-200 p-1">
                        <select
                          value={row.branch}
                          onChange={e => setCell(row._id, 'branch', e.target.value)}
                          className={inputCls}
                        >
                          <option value="">Selectează…</option>
                          {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </td>
                      <td className="border border-gray-200 p-1">
                        <select
                          value={row.tip}
                          onChange={e => setCell(row._id, 'tip', e.target.value)}
                          className={inputCls}
                        >
                          {TIPURI.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="border border-gray-200 p-1">
                        {showCat ? (
                          <select
                            value={row.category}
                            onChange={e => setCell(row._id, 'category', e.target.value)}
                            className={inputCls}
                          >
                            <option value="">—</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <span className="block px-2 py-1.5 text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="border border-gray-200 p-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={row.amount}
                          onChange={e => setCell(row._id, 'amount', e.target.value)}
                          className={`${inputCls} text-right`}
                        />
                      </td>
                      <td className="border border-gray-200 p-1">
                        <input
                          type="text"
                          placeholder="Notă…"
                          value={row.comentarii}
                          onChange={e => setCell(row._id, 'comentarii', e.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="border border-gray-200 p-1 text-center">
                        <button
                          onClick={() => deleteRow(row._id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => setRows(prev => [...prev, emptyRow()])}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <Plus size={15} />
            Adaugă rând
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Anulează
          </button>
          <div className="flex items-center gap-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Check size={16} />
              {saving ? 'Se salvează…' : 'Salvează'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
