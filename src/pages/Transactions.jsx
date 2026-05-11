import { useState } from 'react'
import { Trash2, Search, PlusCircle, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'
import EntryForm from '../components/EntryForm'
import { formatDate, formatCurrency, inRange } from '../utils/dateUtils'

export default function Transactions({ onMenuClick }) {
  const { transactions, branches, deleteTransaction } = useApp()
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('toate')
  const [typeFilter, setTypeFilter] = useState('toate')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const filtered = transactions.filter(t => {
    if (branchFilter !== 'toate' && t.branch !== branchFilter) return false
    if (typeFilter !== 'toate' && t.type !== typeFilter) return false
    if (!inRange(t.date, startDate, endDate)) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.branch?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const inputCls = "rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Tranzacții" onMenuClick={onMenuClick} />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Caută…"
              className={`${inputCls} pl-8 w-full`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className={inputCls} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="toate">Toate Filialele</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className={inputCls} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="toate">Toate Tipurile</option>
            <option value="Venit">Venit</option>
            <option value="Cheltuială">Cheltuială</option>
          </select>
          <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-gray-400 text-sm">până la</span>
          <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button
            onClick={() => setShowForm(v => !v)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={16} />
            Adaugă Intrare
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Tranzacție Nouă</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <EntryForm onSaved={() => setShowForm(false)} />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Data', 'Filială', 'Tip', 'Categorie', 'Sumă', 'Descriere', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                      Nu s-au găsit tranzacții.
                    </td>
                  </tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{t.branch}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.type === 'Venit'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.category || '—'}</td>
                    <td className={`px-4 py-3 font-semibold whitespace-nowrap ${
                      t.type === 'Venit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.type === 'Venit' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{t.description || '—'}</td>
                    <td className="px-4 py-3">
                      {confirmId === t.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { deleteTransaction(t.id); setConfirmId(null) }}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            Confirmă
                          </button>
                          <button onClick={() => setConfirmId(null)} className="text-xs text-gray-500 hover:underline">
                            Anulează
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(t.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
              {filtered.length} tranzacți{filtered.length === 1 ? 'e' : 'i'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
