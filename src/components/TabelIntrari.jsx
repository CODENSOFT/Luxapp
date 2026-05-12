import { useState } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { today } from '../utils/dateUtils'

function emptyRow() {
  return { _id: Math.random(), date: today(), branch: '', incasare: '', avans: '', comentarii: '' }
}

export default function TabelIntrari({ onClose }) {
  const { branches, saveEntry } = useApp()
  const [rows, setRows] = useState(() => Array.from({ length: 5 }, emptyRow))
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
    const filled = rows.filter(r => r.incasare !== '' || r.avans !== '')
    if (filled.length === 0) { setError('Nu există date de salvat.'); return }

    const missingBranch = filled.find(r => !r.branch)
    if (missingBranch) { setError('Selectați filiala pentru toate rândurile completate.'); return }

    setSaving(true)
    for (const r of filled) {
      const inc = parseFloat(r.incasare) || 0
      const av = parseFloat(r.avans) || 0
      const expenses = av > 0 ? [{ amount: av, category: '', comentariu: r.comentarii }] : []
      await saveEntry(r.date, r.branch, inc, expenses)
    }
    setSaving(false)
    onClose()
  }

  const cellInput = "w-full px-3 py-2.5 bg-transparent text-gray-900 text-sm outline-none focus:bg-blue-50 transition-colors"

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Tranzacție Nouă</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Table */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: 680 }}>
            <thead>
              <tr className="bg-gray-50">
                {[
                  { label: 'Data', cls: 'w-36' },
                  { label: 'Filială', cls: 'w-40' },
                  { label: 'Încasare', cls: 'w-32 text-right' },
                  { label: 'Avans', cls: 'w-32 text-right' },
                  { label: 'Comentarii', cls: '' },
                  { label: 'Total', cls: 'w-28 text-right' },
                  { label: '', cls: 'w-10' },
                ].map(({ label, cls }) => (
                  <th
                    key={label}
                    className={`border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left ${cls}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const inc = parseFloat(row.incasare) || 0
                const av = parseFloat(row.avans) || 0
                const total = inc - av
                const hasData = row.incasare !== '' || row.avans !== ''

                return (
                  <tr key={row._id} className="group hover:bg-gray-50/60">
                    <td className="border border-gray-200 p-0">
                      <input
                        type="date"
                        value={row.date}
                        onChange={e => setCell(row._id, 'date', e.target.value)}
                        className={cellInput}
                      />
                    </td>
                    <td className="border border-gray-200 p-0">
                      <select
                        value={row.branch}
                        onChange={e => setCell(row._id, 'branch', e.target.value)}
                        className={`${cellInput} cursor-pointer`}
                      >
                        <option value="">Selectează…</option>
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </td>
                    <td className="border border-gray-200 p-0">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.incasare}
                        onChange={e => setCell(row._id, 'incasare', e.target.value)}
                        placeholder="0.00"
                        className={`${cellInput} text-right`}
                      />
                    </td>
                    <td className="border border-gray-200 p-0">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.avans}
                        onChange={e => setCell(row._id, 'avans', e.target.value)}
                        placeholder="0.00"
                        className={`${cellInput} text-right`}
                      />
                    </td>
                    <td className="border border-gray-200 p-0">
                      <input
                        type="text"
                        value={row.comentarii}
                        onChange={e => setCell(row._id, 'comentarii', e.target.value)}
                        placeholder="Notă…"
                        className={cellInput}
                      />
                    </td>
                    <td className={`border border-gray-200 px-3 py-2.5 text-right font-semibold tabular-nums ${
                      !hasData ? 'text-gray-300' : total >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {hasData ? `${total >= 0 ? '+' : ''}${total.toFixed(2)}` : '—'}
                    </td>
                    <td className="border border-gray-200 p-0">
                      <button
                        onClick={() => deleteRow(row._id)}
                        className="w-full h-full flex items-center justify-center p-2.5 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <button
            onClick={() => setRows(prev => [...prev, emptyRow()])}
            className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <Plus size={15} />
            Adaugă rând
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-4 shrink-0">
          {error && <p className="text-sm text-red-500 flex-1">{error}</p>}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Anulează
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Check size={16} />
              {saving ? 'Se salvează…' : 'Salvează tot'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
