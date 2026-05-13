import { useState } from 'react'
import { Trash2, Search, Edit2, User, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'
import CellModal from '../components/CellModal'
import { formatDate, formatCurrency, inRange } from '../utils/dateUtils'

/** Text indexat la căutare: filială, dată (ISO + ro), categorii, comentarii, sume (încasare / avans / rămâne). */
function entrySearchHaystack(entry) {
  const parts = []
  const dateStr = entry.date || ''
  if (dateStr) {
    parts.push(dateStr)
    parts.push(dateStr.replace(/-/g, '.'))
    parts.push(dateStr.replace(/-/g, '/'))
    parts.push(formatDate(dateStr))
  }
  parts.push((entry.branch || '').trim())

  const inc = Number(entry.incasare) || 0
  const avTotal = (entry.expenses || []).reduce((s, x) => s + (Number(x.amount) || 0), 0)
  const net = inc - avTotal

  function pushAmount(n) {
    if (!Number.isFinite(n) || n === 0) return
    parts.push(String(n))
    parts.push(n.toFixed(2))
    parts.push(n.toLocaleString('ro-MD', { maximumFractionDigits: 2 }))
    parts.push(
      new Intl.NumberFormat('ro-MD', { useGrouping: false, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n)
    )
    try {
      const cur = formatCurrency(n)
      parts.push(cur)
      parts.push(cur.replace(/\s*MDL\s*/gi, '').trim())
    } catch { /* ignore */ }
  }

  pushAmount(inc)
  pushAmount(avTotal)
  pushAmount(net)

  for (const x of entry.expenses || []) {
    parts.push((x.category || '').trim())
    parts.push((x.comentariu || '').trim())
    pushAmount(Number(x.amount) || 0)
  }

  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function entryMatchesSearch(entry, searchRaw) {
  const trimmed = searchRaw.trim().toLowerCase()
  if (!trimmed) return true

  const hay = entrySearchHaystack(entry)
  const tokens = trimmed.split(/\s+/).filter(Boolean)

  const normalizedNum = (s) => s.replace(/\s/g, '').replace(',', '.')

  return tokens.every(tok => {
    if (hay.includes(tok)) return true
    const asNum = normalizedNum(tok)
    if (/^\d+\.?\d*$/.test(asNum) && hay.includes(asNum)) return true
    if (/^\d+[.,]\d{2}$/.test(tok.replace(/\s/g, ''))) {
      const t2 = normalizedNum(tok)
      if (hay.includes(t2)) return true
    }
    return false
  })
}

export default function Transactions({ onMenuClick }) {
  const { entries, branches, deleteEntry } = useApp()
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('toate')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [modal, setModal] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [deleteCode, setDeleteCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [empQuery, setEmpQuery] = useState('')

  function startDelete(id) { setConfirmId(id); setDeleteCode(''); setCodeError(false) }
  function cancelDelete()  { setConfirmId(null); setDeleteCode(''); setCodeError(false) }
  function confirmDelete() {
    if (deleteCode === '1379') { deleteEntry(confirmId); cancelDelete() }
    else { setCodeError(true); setDeleteCode('') }
  }

  // ── Raport avansuri angajat ───────────────────────────────────────
  const empTrimmed = empQuery.trim().toLowerCase()
  const empLines = empTrimmed
    ? entries
        .filter(e => inRange(e.date, startDate, endDate))
        .flatMap(e =>
          (e.expenses || [])
            .filter(exp =>
              (exp.comentariu || '').toLowerCase().includes(empTrimmed) ||
              (exp.category || '').toLowerCase().includes(empTrimmed)
            )
            .map(exp => ({
              date: e.date,
              branch: e.branch,
              amount: Number(exp.amount) || 0,
              category: exp.category || '',
              comentariu: exp.comentariu || '',
            }))
        )
        .sort((a, b) => b.date.localeCompare(a.date))
    : []
  const empTotal = empLines.reduce((s, l) => s + l.amount, 0)

  const filtered = entries.filter(e => {
    const hasData = (Number(e.incasare) || 0) > 0 ||
      (e.expenses || []).some(x => (Number(x.amount) || 0) > 0)
    if (!hasData) return false
    if (branchFilter !== 'toate' && e.branch !== branchFilter) return false
    if (!inRange(e.date, startDate, endDate)) return false
    if (search.trim()) return entryMatchesSearch(e, search)
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

      <div className="p-4 sm:p-6 space-y-4">
        {/* ── Filtre principale ───────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filială, dată, sumă, categorie, comentariu…"
              className={`${inputCls} pl-8 w-full`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Căutare în tranzacții"
            />
          </div>
          <select className={inputCls} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="toate">Toate Filialele</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-gray-400 text-sm shrink-0">până la</span>
          <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        {/* ── Căutare avans angajat ────────────────────────────────── */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
          <div className="relative max-w-sm">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
            <input
              type="text"
              placeholder="Caută angajat… ex: Radu"
              className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 pl-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={empQuery}
              onChange={e => setEmpQuery(e.target.value)}
            />
            {empQuery && (
              <button onClick={() => setEmpQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {empTrimmed && (
            empLines.length === 0 ? (
              <p className="text-sm text-blue-500">Nicio cheltuială cu „{empQuery.trim()}" în categorie sau comentariu{(startDate || endDate) ? ' pentru perioada selectată' : ''}.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-blue-800">
                    Avansuri: <span className="text-gray-900">"{empQuery.trim()}"</span>
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                    {empLines.length} avans{empLines.length !== 1 ? 'uri' : ''}
                  </span>
                  <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-700">
                    Total: {formatCurrency(empTotal)}
                  </span>
                  {(startDate || endDate) && (
                    <span className="text-xs text-blue-500">
                      {startDate && endDate ? `${startDate} → ${endDate}` : startDate ? `de la ${startDate}` : `până la ${endDate}`}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-blue-100 bg-blue-50">
                        {['Data', 'Filială', 'Categorie', 'Sumă', 'Comentariu'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {empLines.map((l, i) => (
                        <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDate(l.date)}</td>
                          <td className="px-3 py-2 text-gray-800 font-medium whitespace-nowrap">{l.branch}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{l.category || '—'}</td>
                          <td className="px-3 py-2 font-semibold text-red-600 whitespace-nowrap tabular-nums">{formatCurrency(l.amount)}</td>
                          <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate" title={l.comentariu}>{l.comentariu}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-blue-200 bg-blue-50">
                        <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-blue-700 uppercase tracking-wide">
                          Total
                        </td>
                        <td className="px-3 py-2 font-bold text-red-700 whitespace-nowrap tabular-nums">
                          {formatCurrency(empTotal)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          )}

          {!empTrimmed && (
            <p className="text-xs text-blue-400">
              Introduceți un nume (ex: „Radu") — caută în categoria și comentariul fiecărei cheltuieli.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Data', 'Filială', 'Încasare', 'Avans (cheltuieli)', 'Rămâne (net)', 'Cheltuieli', ''].map(h => (
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
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex flex-col gap-0.5">
                          {(entry.expenses || []).map((exp, j) => (
                            <span key={j} className="text-xs leading-snug">
                              <span className="font-semibold text-red-600 tabular-nums">{formatCurrency(exp.amount)}</span>
                              {exp.comentariu ? <span className="text-gray-500"> · {exp.comentariu}</span> : null}
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
                            <div className="flex items-center gap-1">
                              <input
                                type="password"
                                inputMode="numeric"
                                placeholder="Cod"
                                autoFocus
                                value={deleteCode}
                                onChange={e => { setDeleteCode(e.target.value); setCodeError(false) }}
                                onKeyDown={e => { if (e.key === 'Enter') confirmDelete(); if (e.key === 'Escape') cancelDelete() }}
                                className={`w-14 text-xs px-1.5 py-1 rounded border outline-none focus:ring-1 focus:ring-red-400 ${codeError ? 'border-red-400 bg-red-50 placeholder:text-red-300' : 'border-gray-300'}`}
                              />
                              <button onClick={confirmDelete} className="text-xs text-red-600 hover:text-red-800 font-bold">✓</button>
                              <button onClick={cancelDelete} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startDelete(entry.id)}
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
