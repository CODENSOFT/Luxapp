import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { X, Check, ChevronLeft, ChevronRight, Trash2, Coins, Wallet, MessageSquareText } from 'lucide-react'
import { useApp } from '../context/AppContext'
import CellModal from './CellModal'
import { currentMonthKey, formatMonthRo, monthDays, addMonths } from '../utils/dateUtils'

const BRANCH_BG  = { 'Lunca Bâcului':'#FFD6D6','Centru':'#D6E4FF','Sîngera':'#D6FFD6','Orhei':'#E8D6FF','Мойка 5':'#FFFBD6' }
const BRANCH_HDR = { 'Lunca Bâcului':'#FFC0C0','Centru':'#BFCFFF','Sîngera':'#BFEDBA','Orhei':'#D5BAFF','Мойка 5':'#FFE97A' }
const FALLBACK_BG  = ['#F0F0F0','#E8F4E8','#E8E8F4','#F4ECE8','#ECF4EC']
const FALLBACK_HDR = ['#D8D8D8','#C8E8C8','#C8C8E8','#E4D4C8','#D4E8D4']
const CAT_CLR = {
  'Salariu':'bg-blue-100 text-blue-700','Chirie':'bg-violet-100 text-violet-700',
  'Utilități':'bg-orange-100 text-orange-700','Consumabile':'bg-emerald-100 text-emerald-700',
  'Combustibil':'bg-amber-100 text-amber-700','Reparații':'bg-red-100 text-red-700',
  'Marketing':'bg-pink-100 text-pink-700','Altele':'bg-gray-100 text-gray-600',
}

function bg(br, i)  { return BRANCH_BG[br]  || FALLBACK_BG[i  % FALLBACK_BG.length] }
function hdr(br, i) { return BRANCH_HDR[br] || FALLBACK_HDR[i % FALLBACK_HDR.length] }

function fmt(n) {
  if (!n) return ''
  const a = Math.abs(n).toLocaleString('ro-MD', { maximumFractionDigits: 2 })
  return n < 0 ? `(${a})` : a
}

const ROW1 = 40
const ROW2 = 44
const N = 'w-full min-h-[2.25rem] bg-white/50 text-right text-[13px] px-2 py-2 outline-none rounded-md border border-transparent focus:border-blue-400 focus:bg-white tabular-nums placeholder:text-slate-400'

function weekdayShortRo(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('ro-RO', { weekday: 'short' })
}

function branchTitleCase(name) {
  if (!name) return ''
  if (name !== name.toUpperCase()) return name
  return name
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function linesFromExpenses(ex) {
  const rows = (ex || []).map(e => ({
    amount: e.amount != null && e.amount !== '' ? String(e.amount) : '',
    category: e.category || '',
    comentariu: e.comentariu || '',
  }))
  rows.push({ amount: '', category: '', comentariu: '' })
  return rows
}

function cleanExpenseLines(lines) {
  return lines
    .filter(l => parseFloat(l.amount) > 0)
    .map(l => ({
      amount: parseFloat(l.amount),
      category: l.category || '',
      comentariu: l.comentariu || '',
    }))
}

/** Avans: editare directă în tabel — Enter = rând nou + salvare (fără „cartonaș” / modal). */
function AvansCell({ dateStr, branch, incValue, initialExpenses, expenseSig, saveEntry, categories }) {
  const [lines, setLines] = useState(() => linesFromExpenses(initialExpenses))
  const amountRefs = useRef([])
  const linesRef = useRef(lines)
  const skipSync = useRef(false)
  linesRef.current = lines

  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false
      return
    }
    setLines(linesFromExpenses(initialExpenses))
  }, [expenseSig])

  const persist = useCallback(async (nextLines) => {
    const clean = cleanExpenseLines(nextLines)
    await saveEntry(dateStr, branch, parseFloat(incValue) || 0, clean)
  }, [dateStr, branch, incValue, saveEntry])

  function setLine(i, field, value) {
    setLines(prev => prev.map((row, j) => (j === i ? { ...row, [field]: value } : row)))
  }

  async function handleAmountKeyDown(e, i) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const amt = parseFloat(lines[i]?.amount)
    if (!(amt > 0)) return

    let next = [...lines]
    if (i === next.length - 1) {
      next = [...next, { amount: '', category: '', comentariu: '' }]
    }
    setLines(next)
    skipSync.current = true
    await persist(next)

    const focusIdx = i === lines.length - 1 ? i + 1 : i + 1
    setTimeout(() => {
      amountRefs.current[focusIdx]?.focus()
    }, 0)
  }

  async function removeLine(i) {
    let next = lines.filter((_, j) => j !== i)
    if (!next.length) next = [{ amount: '', category: '', comentariu: '' }]
    else if (parseFloat(next[next.length - 1].amount) > 0 || next[next.length - 1].category) {
      next = [...next, { amount: '', category: '', comentariu: '' }]
    }
    setLines(next)
    skipSync.current = true
    await persist(next)
  }

  async function handleBlurPersist() {
    skipSync.current = true
    await persist(linesRef.current)
  }

  const inpAmt =
    'w-[4.5rem] shrink-0 bg-white text-right text-[12px] px-2 py-1.5 rounded-md border border-slate-200 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300 tabular-nums placeholder:text-slate-400'
  const selCat =
    'min-w-[5.25rem] flex-1 max-w-full text-[11px] bg-white border border-slate-200 rounded-md px-1.5 py-1.5 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300'

  return (
    <div
      className="flex flex-col gap-1.5 py-1"
      onClick={e => e.stopPropagation()}
      role="group"
      aria-label="Cheltuieli / avans"
    >
      {lines.map((row, i) => (
        <div
          key={i}
          className="flex items-stretch gap-1.5"
        >
          <input
            ref={el => { amountRefs.current[i] = el }}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="MDL"
            aria-label={`Sumă cheltuială ${i + 1}`}
            value={row.amount}
            onChange={e => setLine(i, 'amount', e.target.value)}
            onKeyDown={e => handleAmountKeyDown(e, i)}
            onBlur={handleBlurPersist}
            className={inpAmt}
          />
          <select
            value={row.category}
            onChange={e => setLine(i, 'category', e.target.value)}
            onBlur={handleBlurPersist}
            className={selCat}
            title={row.category || 'Alegeți categoria'}
            aria-label={`Categorie cheltuială ${i + 1}`}
          >
            <option value="">Categorie…</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {(() => {
            const lastEmpty = i === lines.length - 1 && !parseFloat(row.amount) && !row.category
            if (lastEmpty) return null
            return (
              <button
                type="button"
                title="Șterge această cheltuială"
                onClick={() => removeLine(i)}
                className="shrink-0 self-center rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            )
          })()}
        </div>
      ))}
    </div>
  )
}

export default function TabelIntrari({ onClose, branchFilter, initialMonth }) {
  const { tableBranches, getEntry, saveEntry, categories } = useApp()
  const displayBranches = branchFilter ? [branchFilter] : tableBranches
  const [month,    setMonth]    = useState(() => initialMonth || currentMonthKey())
  const [incDraft, setIncDraft] = useState({})        // { "day|br": "value" } — unsaved Încasare
  const [cellModal,setCellModal]= useState(null)      // { dateStr, branch }
  const [saving,   setSaving]   = useState(false)

  const days   = monthDays(month)
  const todayS = new Date().toISOString().slice(0, 10)

  // ── data helpers ─────────────────────────────────────────────────
  function getInc(day, br) {
    const key = `${day}|${br}`
    if (incDraft[key] !== undefined) return incDraft[key]
    const e = getEntry(`${month}-${day}`, br)
    return e?.incasare > 0 ? String(e.incasare) : ''
  }
  function setInc(day, br, val) {
    setIncDraft(p => ({ ...p, [`${day}|${br}`]: val }))
  }
  function exps(day, br)  { return getEntry(`${month}-${day}`, br)?.expenses || [] }
  function avSum(day, br) { return exps(day, br).reduce((s, x) => s + (Number(x.amount) || 0), 0) }
  function rowNet(day, br){ return (parseFloat(getInc(day, br)) || 0) - avSum(day, br) }
  function daySum(day)    { return displayBranches.reduce((s, b) => s + rowNet(day, b), 0) }
  function colInc(br)     { return days.reduce((s, d) => s + (parseFloat(getInc(d.slice(8), br)) || 0), 0) }
  function colAv(br)      { return days.reduce((s, d) => s + avSum(d.slice(8), br), 0) }
  function colNet(br)     { return colInc(br) - colAv(br) }
  function grandNet()     { return displayBranches.reduce((s, b) => s + colNet(b), 0) }
  function hasCell(d, br) { return (parseFloat(getInc(d, br)) || 0) > 0 || avSum(d, br) > 0 }
  function hasMonth()     { return displayBranches.some(b => colInc(b) > 0 || colAv(b) > 0) }

  // ── open CellModal (auto-save draft Încasare first) ───────────────
  async function openCell(day, br) {
    const dateStr = `${month}-${day}`
    const key     = `${day}|${br}`
    const draft   = incDraft[key]
    if (draft !== undefined) {
      const existing = getEntry(dateStr, br)
      await saveEntry(dateStr, br, parseFloat(draft) || 0, existing?.expenses || [])
      setIncDraft(p => { const n = { ...p }; delete n[key]; return n })
    }
    setCellModal({ dateStr, branch: br })
  }

  function changeMonth(delta) {
    setMonth(m => addMonths(m, delta))
    setIncDraft({})
  }

  async function handleSave() {
    setSaving(true)
    for (const dateStr of days) {
      const day = dateStr.slice(8)
      for (const br of displayBranches) {
        const draft = incDraft[`${day}|${br}`]
        if (draft !== undefined) {
          const inc = parseFloat(draft) || 0
          const existing = getEntry(dateStr, br)
          await saveEntry(dateStr, br, inc, existing?.expenses || [])
        }
      }
    }
    setSaving(false)
    setIncDraft({})
    onClose()
  }

  const border   = '1px solid rgba(0,0,0,.1)'
  const borderHd = '1px solid rgba(0,0,0,.18)'

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#f1f5f9' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 shrink-0"
           style={{ background: '#1e3a5f', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}>
        <button onClick={onClose}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <X size={17} />
        </button>

        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)}
                  className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <h1 className="text-white text-center select-none px-2">
            <span className="block text-[15px] font-semibold tracking-tight">
              {branchFilter ? branchTitleCase(branchFilter) : 'Încasări și cheltuieli (avans)'}
            </span>
            <span className="block text-[11px] font-normal text-white/75 mt-0.5">
              {formatMonthRo(month)}
            </span>
          </h1>
          <button onClick={() => changeMonth(1)}
                  className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>

        <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors">
          <Check size={14} />
          {saving ? 'Salvez…' : 'Salvează'}
        </button>
      </div>

      {/* ── Ghid rapid (structură în 3 pași) ─────────────────────── */}
      <div className="shrink-0 border-b border-slate-200/90 bg-linear-to-b from-white to-slate-50 px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
          Cum completați tabelul
        </p>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Wallet className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">1. Încasare</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Suma încasată la filială în acea zi. Rămâne în ciornă până apăsați <strong className="text-slate-700">Salvează</strong> sus-dreapta.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <Coins className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">2. Avans (cheltuieli)</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Completați suma și categoria. Se salvează <strong className="text-slate-700">automat</strong>. După sumă, apăsați <strong className="text-slate-700">Enter</strong> pentru o cheltuială nouă pe rândul următor.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <MessageSquareText className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">3. Comentarii</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Click pe această coloană pentru <strong className="text-slate-700">note</strong>, comentarii la fiecare cheltuială și verificare detaliată.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabel ─────────────────────────────────────────────────── */}
      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto px-3 pb-3 pt-2">
        <div className="mx-auto w-max min-w-full max-w-none rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/4">
        <table className="min-w-max border-collapse text-[13px]">
          <thead>
            <tr style={{ height: ROW1 }}>
              <th rowSpan={2} scope="col" style={{
                position: 'sticky', top: 0, left: 0, zIndex: 50,
                background: '#1e3a5f', color: '#fff',
                border: '1px solid #334d6e', padding: '6px 10px',
                textAlign: 'center', minWidth: 56, fontWeight: 700, fontSize: 11,
                boxShadow: '2px 0 6px rgba(0,0,0,.12)',
                verticalAlign: 'middle',
              }}>
                <span className="block leading-tight">Ziua</span>
                <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-white/70">
                  data
                </span>
              </th>

              {displayBranches.map((br) => (
                <th key={br} colSpan={4} scope="colgroup" style={{
                  position: 'sticky', top: 0, zIndex: 20,
                  background: '#1e3a5f', color: '#fff',
                  border: '1px solid #334d6e',
                  padding: '6px 12px', textAlign: 'center',
                  fontWeight: 700, fontSize: 12,
                  letterSpacing: '0.02em',
                }}>{branchTitleCase(br)}</th>
              ))}

              <th rowSpan={2} scope="col" style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: '#b45309', color: '#fff',
                border: '1px solid #92400e',
                padding: '6px 12px', textAlign: 'center',
                minWidth: 100, fontWeight: 700, fontSize: 11,
                verticalAlign: 'middle',
              }}>
                <span className="block leading-tight">Total zi</span>
                <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-white/80">
                  toate filialele
                </span>
              </th>
            </tr>

            <tr style={{ height: ROW2, boxShadow: '0 1px 0 0 rgba(15,23,42,0.08)' }}>
              {displayBranches.map((br, i) => {
                const h = hdr(br, i)
                const subCols = [
                  { label: 'Încasare', sub: 'MDL încasați', w: 92 },
                  { label: 'Avans', sub: 'Cheltuieli · Enter = rând nou', w: 188, title: 'După sumă validă, Enter adaugă următoarea cheltuială.' },
                  { label: 'Comentarii', sub: 'Click pentru note', w: 128 },
                  { label: 'Rămâne', sub: 'Încasare − cheltuieli', w: 92 },
                ]
                return (
                  <Fragment key={br}>
                    {subCols.map(({ label, sub, w, title }) => (
                      <th key={`${br}-${label}`} scope="col" title={title} style={{
                        position: 'sticky', top: ROW1, zIndex: 20,
                        background: h, border: borderHd,
                        padding: '6px 8px', textAlign: 'center',
                        color: '#1e293b', fontWeight: 600, fontSize: 11,
                        minWidth: w, letterSpacing: '.01em',
                        verticalAlign: 'middle', lineHeight: 1.25,
                      }}>
                        <span className="block normal-case tracking-tight">{label}</span>
                        <span className="mt-0.5 block text-[9px] font-normal text-slate-600 normal-case tracking-normal">
                          {sub}
                        </span>
                      </th>
                    ))}
                  </Fragment>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {days.map(dateStr => {
              const day     = dateStr.slice(8)
              const isToday = dateStr === todayS
              const ds      = daySum(day)
              const hd      = displayBranches.some(b => hasCell(day, b))
              const wd      = weekdayShortRo(dateStr)

              return (
                <tr key={day} className="transition-colors hover:bg-slate-50/80"
                    style={{ background: isToday ? '#EFF6FF' : undefined }}>

                  <td style={{
                    position: 'sticky', left: 0, zIndex: 10,
                    background: isToday ? '#DBEAFE' : '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center', padding: '6px 8px',
                    boxShadow: '2px 0 5px rgba(0,0,0,.05)',
                    verticalAlign: 'middle',
                  }}>
                    <span className={`block text-[15px] tabular-nums leading-none ${isToday ? 'font-extrabold text-blue-700' : 'font-bold text-slate-700'}`}>
                      {day}
                    </span>
                    <span className={`mt-1 block text-[10px] font-medium capitalize leading-none ${isToday ? 'text-blue-600/90' : 'text-slate-500'}`}>
                      {wd}
                    </span>
                  </td>

                  {displayBranches.map((br, i) => {
                    const bgc  = bg(br, i)
                    const inc  = getInc(day, br)
                    const exList = exps(day, br)
                    const net  = rowNet(day, br)
                    const hc   = hasCell(day, br)
                    const hasComment = exList.some(e => (e.comentariu || '').trim())
                    const hasCat = exList.some(e => e.category)

                    return (
                      <Fragment key={br}>
                        <td className="align-top" style={{ background: bgc, border, padding: '4px 6px', minWidth: 92 }}>
                          <input
                            type="number" min="0" step="0.01" inputMode="decimal"
                            value={inc} placeholder="0"
                            aria-label={`Încasare ${branchTitleCase(br)}, ziua ${day}`}
                            onChange={e => setInc(day, br, e.target.value)}
                            className={N}
                          />
                        </td>

                        <td
                          className="align-top"
                          style={{
                            background: bgc, border,
                            minWidth: 188, verticalAlign: 'top',
                            padding: '4px 6px',
                          }}
                        >
                          <AvansCell
                            key={`${month}-${day}-${br}`}
                            dateStr={`${month}-${day}`}
                            branch={br}
                            incValue={getInc(day, br)}
                            initialExpenses={exList}
                            expenseSig={JSON.stringify(
                              (exList || []).map(e => [e.amount, e.category, e.comentariu || ''])
                            )}
                            saveEntry={saveEntry}
                            categories={categories}
                          />
                        </td>

                        <td
                          role="button"
                          tabIndex={0}
                          onClick={() => openCell(day, br)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCell(day, br) } }}
                          style={{ background: bgc, border, minWidth: 128, padding: '6px 8px', cursor: 'pointer', verticalAlign: 'top' }}
                          className="group rounded-none transition-colors hover:bg-black/3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500"
                          title="Deschide fereastra cu comentarii și detalii"
                        >
                          <div className="flex min-h-10 flex-wrap content-start items-start gap-1.5">
                            {hasCat ? exList.map((exp, j) => exp.category ? (
                              <span key={j} className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-tight shadow-sm ${CAT_CLR[exp.category] || 'bg-gray-100 text-gray-600'}`}>
                                {exp.category}
                              </span>
                            ) : null) : (
                              <span className="text-[11px] leading-snug text-slate-400 group-hover:text-slate-600">
                                Deschide pentru note…
                              </span>
                            )}
                            {hasComment && (
                              <span className="w-full text-[10px] leading-tight text-slate-500 line-clamp-2" title={exList.map(e => e.comentariu).filter(Boolean).join(' · ')}>
                                {exList.map(e => e.comentariu).filter(Boolean).slice(0, 1).join('')}
                                {exList.filter(e => (e.comentariu || '').trim()).length > 1 ? '…' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="tabular-nums" style={{
                          background: bgc, border, minWidth: 92,
                          textAlign: 'right', padding: '8px 10px', fontWeight: 600, fontSize: 13,
                          verticalAlign: 'middle', whiteSpace: 'nowrap',
                          color: !hc ? '#cbd5e1' : net >= 0 ? '#15803d' : '#dc2626',
                        }} title={hc ? 'Încasare minus total cheltuieli (avans), această zi și filială' : ''}>
                          {hc ? fmt(net) : '—'}
                        </td>
                      </Fragment>
                    )
                  })}

                  <td className="tabular-nums" style={{
                    background: hd ? '#fffbeb' : '#fafaf9',
                    border: '1px solid #e7e5e4',
                    textAlign: 'right', padding: '8px 12px',
                    fontWeight: 700, fontSize: 13, minWidth: 100,
                    verticalAlign: 'middle', whiteSpace: 'nowrap',
                    color: !hd ? '#d6d3d1' : ds >= 0 ? '#15803d' : '#b91c1c',
                  }} title="Însumare «Rămâne» pe toate filialele, pentru această zi">
                    {hd ? fmt(ds) : '—'}
                  </td>
                </tr>
              )
            })}

            <tr className="bg-slate-100/90">
              <td style={{
                position: 'sticky', left: 0, zIndex: 10,
                background: '#334155', color: '#f8fafc',
                border: '1px solid #475569',
                textAlign: 'center', padding: '8px 10px',
                fontWeight: 800, fontSize: 11,
                boxShadow: '2px 0 5px rgba(0,0,0,.1)',
                verticalAlign: 'middle',
              }}>
                <span className="block">Total lună</span>
                <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-wide text-slate-300">
                  pe coloană
                </span>
              </td>

              {displayBranches.map((br, i) => {
                const h  = hdr(br, i)
                const ci = colInc(br), ca = colAv(br), cn = colNet(br)
                const hm = ci > 0 || ca > 0
                return (
                  <Fragment key={br}>
                    <td title="Total încasări în luna afișată, această filială" style={{ background: h, border: borderHd, textAlign: 'right', padding: '8px 10px', fontWeight: 700, fontSize: 12, color: '#15803d', whiteSpace: 'nowrap' }}>
                      {hm && ci ? ci.toLocaleString('ro-MD', { maximumFractionDigits: 2 }) : '—'}
                    </td>
                    <td title="Total cheltuieli (avans) în lună, această filială" style={{ background: h, border: borderHd, textAlign: 'right', padding: '8px 10px', fontWeight: 700, fontSize: 12, color: '#b91c1c', whiteSpace: 'nowrap' }}>
                      {hm && ca ? ca.toLocaleString('ro-MD', { maximumFractionDigits: 2 }) : '—'}
                    </td>
                    <td title="Comentariile se deschid din zilele individuale" style={{ background: h, border: borderHd, padding: '6px', fontSize: 10, color: '#64748b', textAlign: 'center' }}>
                      —
                    </td>
                    <td title="Total «Rămâne» în lună (încasări − cheltuieli), filiala" style={{ background: h, border: borderHd, textAlign: 'right', padding: '8px 10px', fontWeight: 800, fontSize: 12, color: cn >= 0 ? '#15803d' : '#dc2626', whiteSpace: 'nowrap' }}>
                      {hm ? fmt(cn) : '—'}
                    </td>
                  </Fragment>
                )
              })}

              <td title="Total general «Rămâne» în lună (toate filialele)" style={{
                background: '#b45309', color: '#fff',
                border: '1px solid #92400e',
                textAlign: 'right', padding: '8px 12px',
                fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
              }}>
                {hasMonth() ? fmt(grandNet()) : '—'}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <div className="shrink-0 flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs leading-relaxed text-slate-500">
          <p><strong className="text-slate-700">Avans / cheltuieli</strong> — salvare automată la fiecare modificare.</p>
          <p className="mt-0.5"><strong className="text-slate-700">Încasare</strong> — se trimite la server la <strong className="text-slate-700">Salvează</strong> sau când închideți după editare.</p>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 self-end text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline sm:self-auto">
          Închide fereastra
        </button>
      </div>

      {/* ── CellModal (rendered last → appears on top) ───────────── */}
      {cellModal && (
        <CellModal
          date={cellModal.dateStr}
          branch={cellModal.branch}
          onClose={() => setCellModal(null)}
        />
      )}
    </div>
  )
}
