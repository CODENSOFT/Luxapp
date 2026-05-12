import { useState } from 'react'
import { Trash2, Search, Edit2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'
import CellModal from '../components/CellModal'
import { formatDate, formatCurrency, inRange } from '../utils/dateUtils'

export default function Transactions({ onMenuClick }) {
  const { entries, branches, deleteEntry } = useApp()
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('toate')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [modal, setModal] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const filtered = entries.filter(e => {
    if (branchFilter !== 'toate' && e.branch !== branchFilter) return false
    if (!inRange(e.date, startDate, endDate)) return false
    if (search) {
      const q = search.toLowerCase()
      const cats = (e.expenses || []).map(x => x.category).join(' ').toLowerCase()
      const comments = (e.expenses || []).map(x => x.comentariu).join(' ').toLowerCase()
      return e.branch.toLowerCase().includes(q) || cats.includes(q) || comments.includes(q)
    }
    return true
  }).sort((a, b) => b.date.localeCompare(a.date) || b.created_at?.localeCompare(a.created_at || '') || 0)

  const inputCls = "rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Tranzacții" onMenuClick={onMenuClick} />

      {modal && (
        <CellModal
          date={modal.date}
          branch={modal.branch}
          onClose={() => setModal(null)}
        />
      )}

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Caută filială, categorie, comentariu…"
              className={`${inputCls} pl-8 w-full`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className={inputCls} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="toate">Toate Filialele</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-gray-400 text-sm">până la</span>
          <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Data', 'Filială', 'Încasare', 'Total Avans', 'Net', 'Cheltuieli', ''].map(h => (
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
                      Nu s-au găsit înregistrări.
                    </td>
                  </tr>
                ) : filtered.map(entry => {
                  const avTotal = (entry.expenses || []).reduce((s, x) => s + (Number(x.amount) || 0), 0)
                  const net = (Number(entry.incasare) || 0) - avTotal

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{entry.branch}</td>
                      <td className="px-4 py-3 font-semibold text-green-600 whitespace-nowrap">
                        {entry.incasare > 0 ? formatCurrency(entry.incasare) : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-red-600 whitespace-nowrap">
                        {avTotal > 0 ? formatCurrency(avTotal) : '—'}
                      </td>
                      <td className={`px-4 py-3 font-bold whitespace-nowrap ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {formatCurrency(net)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {(entry.expenses || []).map((exp, j) => (
                            <span key={j} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                              {exp.category || '—'} {exp.amount > 0 ? `(${formatCurrency(exp.amount)})` : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModal({ date: entry.date, branch: entry.branch })}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          {confirmId === entry.id ? (
                            <>
                              <button
                                onClick={() => { deleteEntry(entry.id); setConfirmId(null) }}
                                className="text-xs text-red-600 hover:underline font-medium"
                              >
                                Confirmă
                              </button>
                              <button onClick={() => setConfirmId(null)} className="text-xs text-gray-500 hover:underline">
                                Anulează
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmId(entry.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
              {filtered.length} înregistrăr{filtered.length === 1 ? 'e' : 'i'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
