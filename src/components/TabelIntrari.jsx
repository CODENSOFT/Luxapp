import { Fragment, useEffect, useRef, useState } from 'react'
import { X, Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { currentMonthKey, formatMonthRo, monthDays, addMonths } from '../utils/dateUtils'
import DeleteCodeModal from './DeleteCodeModal'

const BRANCH_BG  = { 'Lunca Bâcului':'#FFD6D6','Centru':'#D6E4FF','Sîngera':'#D6FFD6','Orhei':'#E8D6FF','Мойка 5':'#FFFBD6' }
const BRANCH_HDR = { 'Lunca Bâcului':'#FFC0C0','Centru':'#BFCFFF','Sîngera':'#BFEDBA','Orhei':'#D5BAFF','Мойка 5':'#FFE97A' }
const FALLBACK_BG  = ['#F0F0F0','#E8F4E8','#E8E8F4','#F4ECE8','#ECF4EC']
const FALLBACK_HDR = ['#D8D8D8','#C8E8C8','#C8C8E8','#E4D4C8','#D4E8D4']

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

/** Construiește lista comună de cheltuieli a zilei, adunând cheltuielile tuturor
 *  filialelor (păstrând filiala de origine a fiecărei linii), plus o linie goală
 *  la final pentru adăugare rapidă. */
function buildMergedLines(dateStr, branches, getEntry) {
  const out = []
  for (const br of branches) {
    const ex = getEntry(dateStr, br)?.expenses || []
    ex.forEach(e => out.push({
      branch: br,
      amount: e.amount != null && e.amount !== '' ? String(e.amount) : '',
      category: e.category || '',
      comentariu: e.comentariu || '',
    }))
  }
  out.push({ branch: '', amount: '', category: '', comentariu: '' })
  return out
}

function expSig(dateStr, branches, getEntry) {
  return JSON.stringify(
    branches.map(br => (getEntry(dateStr, br)?.expenses || []).map(e => [e.amount, e.category, e.comentariu || '']))
  )
}

/** Secțiune comună „Avans (cheltuieli)” + „Comentarii” pentru toată ziua.
 *  Întoarce două celule (<td>) aliniate: o coloană de sume + o coloană de note.
 *  Editarea se salvează pe filiala de origine a liniei; liniile noi merg pe prima filială. */
function CheltuieliCells({ dateStr, branches, getEntry, incByBranch, saveEntry, compact, border, cellP, avW, commW, bgc }) {
  const [lines, setLines] = useState(() => buildMergedLines(dateStr, branches, getEntry))
  const [pendingRemove, setPendingRemove] = useState(null)
  const amountRefs = useRef([])
  const linesRef = useRef(lines)
  const skipSync = useRef(false)
  useEffect(() => { linesRef.current = lines }, [lines])

  const sig = expSig(dateStr, branches, getEntry)

  useEffect(() => {
    if (skipSync.current) { skipSync.current = false; return }
    setLines(buildMergedLines(dateStr, branches, getEntry))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, dateStr, branches.join('|')])

  function setLine(i, field, value) {
    setLines(prev => prev.map((row, j) => (j === i ? { ...row, [field]: value } : row)))
  }

  async function persist(nextLines) {
    const fallback = branches[0]
    const groups = {}
    for (const br of branches) groups[br] = []
    for (const l of nextLines) {
      if (l.amount === '') continue
      const amt = parseFloat(l.amount)
      if (isNaN(amt) || amt < 0) continue
      const br = (l.branch && branches.includes(l.branch)) ? l.branch : fallback
      if (!groups[br]) groups[br] = []
      groups[br].push({ amount: amt, category: l.category || '', comentariu: l.comentariu || '' })
    }
    for (const br of branches) {
      const existing = getEntry(dateStr, br)
      const cur  = (existing?.expenses || []).map(e => [e.amount, e.category, e.comentariu || ''])
      const next = (groups[br] || []).map(e => [e.amount, e.category, e.comentariu || ''])
      if (JSON.stringify(cur) === JSON.stringify(next)) continue
      await saveEntry(dateStr, br, incByBranch[br] || 0, groups[br] || [])
    }
  }

  async function handleAmountKeyDown(e, i) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const amt = parseFloat(lines[i]?.amount)
    if (lines[i]?.amount === '' || isNaN(amt) || amt < 0) return

    let next = [...lines]
    if (i === next.length - 1) next = [...next, { branch: '', amount: '', category: '', comentariu: '' }]
    setLines(next)
    skipSync.current = true
    await persist(next)
    setTimeout(() => { amountRefs.current[i + 1]?.focus() }, 0)
  }

  async function removeLine(i) {
    let next = lines.filter((_, j) => j !== i)
    if (!next.length || next[next.length - 1].amount !== '') {
      next = [...next, { branch: '', amount: '', category: '', comentariu: '' }]
    }
    setLines(next)
    skipSync.current = true
    await persist(next)
  }

  async function handleBlurPersist() {
    skipSync.current = true
    await persist(linesRef.current)
  }

  const inpAmt = compact
    ? 'flex-1 bg-white text-right text-[11px] px-1 py-1 rounded border border-slate-200 outline-none focus:border-blue-500 tabular-nums placeholder:text-slate-300'
    : 'flex-1 bg-white text-right text-[12px] px-2 py-1.5 rounded-md border border-slate-200 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300 tabular-nums placeholder:text-slate-400'
  const inpComm = compact
    ? 'w-full min-w-0 rounded border border-transparent bg-white/60 px-1 py-1 text-[10px] placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:outline-none'
    : 'w-full min-w-[7rem] rounded-md border border-transparent bg-white/60 px-1.5 py-1.5 text-[11px] placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:outline-none'

  return (
    <>
      <td className="align-top" style={{ background: bgc, border, minWidth: avW, verticalAlign: 'top', padding: cellP }}>
        <div className="flex flex-col gap-1.5 py-1" onClick={e => e.stopPropagation()} role="group" aria-label="Cheltuieli / avans">
          {pendingRemove !== null && (
            <DeleteCodeModal
              onConfirm={() => { removeLine(pendingRemove); setPendingRemove(null) }}
              onCancel={() => setPendingRemove(null)}
            />
          )}
          {lines.map((row, i) => (
            <div key={i} className="flex items-stretch gap-1.5">
              <input
                ref={el => { amountRefs.current[i] = el }}
                type="number" min="0" step="0.01" inputMode="decimal"
                placeholder="MDL"
                aria-label={`Sumă cheltuială ${i + 1}`}
                value={row.amount}
                onChange={e => setLine(i, 'amount', e.target.value)}
                onKeyDown={e => handleAmountKeyDown(e, i)}
                onBlur={handleBlurPersist}
                className={inpAmt}
              />
              {(() => {
                const lastEmpty = i === lines.length - 1 && row.amount === ''
                if (lastEmpty) return null
                return (
                  <button
                    type="button"
                    title="Șterge această cheltuială"
                    onClick={() => setPendingRemove(i)}
                    className="shrink-0 self-center rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                )
              })()}
            </div>
          ))}
        </div>
      </td>

      <td className="align-top" style={{ background: bgc, border, minWidth: commW, padding: cellP, verticalAlign: 'top' }}>
        <div className="flex flex-col gap-1.5 py-1">
          {lines.map((row, i) => (
            <input
              key={i}
              type="text"
              placeholder="notă…"
              value={row.comentariu}
              onChange={e => setLine(i, 'comentariu', e.target.value)}
              onBlur={handleBlurPersist}
              className={inpComm}
            />
          ))}
        </div>
      </td>
    </>
  )
}

export default function TabelIntrari({ onClose, branchFilter, initialMonth }) {
  const { tableBranches, getEntry, saveEntry, entries } = useApp()
  const displayBranches = branchFilter ? [branchFilter] : tableBranches
  const [month,         setMonth]         = useState(() => initialMonth || currentMonthKey())
  const [incDraft,      setIncDraft]      = useState({})
  const [mobileBranchIdx, setMobileBranchIdx] = useState(0)
  const [isMobile,      setIsMobile]     = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const safeIdx      = Math.min(mobileBranchIdx, displayBranches.length - 1)
  const activeBranches = (isMobile && displayBranches.length > 1)
    ? [displayBranches[safeIdx]]
    : displayBranches

  // Deschidere pe o filială aparte (din „Statistici Filiale”): doar încasări, fără restul coloanelor
  const incomeOnly = !!branchFilter

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
  function colInc(br)     { return days.reduce((s, d) => s + (parseFloat(getInc(d.slice(8), br)) || 0), 0) }
  function colAv(br)      { return days.reduce((s, d) => s + avSum(d.slice(8), br), 0) }
  function hasCell(d, br) { return (parseFloat(getInc(d, br)) || 0) > 0 || avSum(d, br) > 0 }

  // totaluri „toate filialele”
  function incDay(day)    { return activeBranches.reduce((s, b) => s + (parseFloat(getInc(day, b)) || 0), 0) }
  function avDay(day)     { return activeBranches.reduce((s, b) => s + avSum(day, b), 0) }
  function incMonth()     { return activeBranches.reduce((s, b) => s + colInc(b), 0) }
  function avMonth()      { return activeBranches.reduce((s, b) => s + colAv(b), 0) }

  function isBanca(c)     { return /banca/i.test(c || '') }
  function bancaDay(day)  {
    return activeBranches.reduce((s, b) =>
      s + exps(day, b).reduce((ss, x) => isBanca(x.comentariu) ? ss + (Number(x.amount) || 0) : ss, 0)
    , 0)
  }
  function bancaMonth()   { return days.reduce((s, d) => s + bancaDay(d.slice(8)), 0) }
  // Cheltuieli total = toate cheltuielile zilei, INCLUSIV sumele duse la bancă
  function cheltDay(day)  { return avDay(day) }
  function cheltMonth()   { return avMonth() }
  // Net zilnic care intră/iese din seif = încasări − toate cheltuielile (inclusiv banca)
  function ramasDay(day)  { return incDay(day) - avDay(day) }
  function hasMonth()     { return activeBranches.some(b => colInc(b) > 0 || colAv(b) > 0) }

  // Sold „seif” — reportul din lunile anterioare (toate zilele de dinainte de luna curentă)
  function openingBalance() {
    const monthStart = `${month}-01`
    return entries.reduce((s, e) => {
      if (!activeBranches.includes(e.branch)) return s
      if (!e.date || e.date >= monthStart) return s
      const inc = Number(e.incasare) || 0
      const exp = (e.expenses || []).reduce((ss, x) => ss + (Number(x.amount) || 0), 0)
      return s + inc - exp
    }, 0)
  }

  function changeMonth(delta) {
    setMonth(m => addMonths(m, delta))
    setIncDraft({})
  }

  async function saveIncOnBlur(day, br, domValue) {
    const existing = getEntry(`${month}-${day}`, br)
    await saveEntry(`${month}-${day}`, br, parseFloat(domValue) || 0, existing?.expenses || [])
    setIncDraft(p => { const n = { ...p }; delete n[`${day}|${br}`]; return n })
  }

  // Sold cumulat în seif: reportul lunilor anterioare + net-ul fiecărei zile din luna curentă
  const opening = openingBalance()
  const runningByDay = {}
  {
    let acc = opening
    for (const ds of days) { const d = ds.slice(8); acc += ramasDay(d); runningByDay[d] = acc }
  }
  const closing = days.reduce((s, ds) => s + ramasDay(ds.slice(8)), opening)

  const border   = '1px solid rgba(0,0,0,.1)'
  const borderHd = '1px solid rgba(0,0,0,.18)'

  // ── responsive layout ────────────────────────────────────────────
  const m       = isMobile
  const dayW    = m ? 36  : 56
  const incW    = m ? 68  : 92
  const avW     = m ? 96  : 188
  const commW   = m ? 82  : 128
  const cellP   = m ? '2px 3px' : '4px 6px'
  const hRow1   = m ? 28 : ROW1
  const hRow2   = m ? 26 : ROW2
  const incCls  = m
    ? 'w-full bg-white/50 text-right text-[11px] px-1 py-0.5 outline-none rounded border border-transparent focus:border-blue-400 focus:bg-white tabular-nums'
    : N

  const AVANS_BG = '#f8fafc'

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
            <span className="block text-[18px] font-bold tracking-tight">
              {formatMonthRo(month)}
            </span>
            {branchFilter && (
              <span className="block text-[11px] font-normal text-white/70 mt-0.5">
                {branchTitleCase(branchFilter)}
              </span>
            )}
          </h1>
          <button onClick={() => changeMonth(1)}
                  className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>

        <button onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-semibold transition-colors">
          <Check size={14} />
          Închide
        </button>
      </div>

      {/* ── Tab-uri filiale (mobile) ──────────────────────────────── */}
      {displayBranches.length > 1 && (
        <div className="shrink-0 flex gap-1.5 overflow-x-auto px-3 py-2 border-b border-slate-700/40"
             style={{ background: '#162d4a' }}>
          {displayBranches.map((br, i) => (
            <button
              key={br}
              onClick={() => setMobileBranchIdx(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                i === safeIdx && isMobile
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white'
              }`}
            >
              {branchTitleCase(br)}
            </button>
          ))}
          {isMobile && (
            <span className="ml-auto shrink-0 self-center text-[10px] text-white/40 pr-1">
              ← glisează
            </span>
          )}
        </div>
      )}


      {/* ── Tabel ─────────────────────────────────────────────────── */}
      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto px-3 pb-3 pt-2">
        <div className="mx-auto w-max max-w-none rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/4">
        <table className="min-w-max border-collapse text-[13px]">
          <thead>
            <tr style={{ height: hRow1 }}>
              <th rowSpan={2} scope="col" style={{
                position: 'sticky', top: 0, left: 0, zIndex: 50,
                background: '#1e3a5f', color: '#fff',
                border: '1px solid #334d6e', padding: m ? '4px 6px' : '6px 10px',
                textAlign: 'center', minWidth: dayW, fontWeight: 700, fontSize: m ? 10 : 11,
                boxShadow: '2px 0 6px rgba(0,0,0,.12)',
                verticalAlign: 'middle',
              }}>
                <span className="block leading-tight">Ziua</span>
                {!m && <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-white/70">data</span>}
              </th>

              {activeBranches.map((br) => (
                <th key={br} colSpan={1} scope="colgroup" style={{
                  position: 'sticky', top: 0, zIndex: 20,
                  background: '#1e3a5f', color: '#fff',
                  border: '1px solid #334d6e',
                  padding: m ? '4px 6px' : '6px 12px', textAlign: 'center',
                  fontWeight: 700, fontSize: m ? 10 : 12,
                  letterSpacing: '0.02em',
                }}>{branchTitleCase(br)}</th>
              ))}

              {!incomeOnly && (<>
              {/* Secțiune comună cheltuieli */}
              <th colSpan={2} scope="colgroup" style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: '#475569', color: '#fff',
                border: '1px solid #334155',
                padding: m ? '4px 6px' : '6px 12px', textAlign: 'center',
                fontWeight: 700, fontSize: m ? 10 : 12, letterSpacing: '0.02em',
              }}>
                <span className="block leading-tight">Cheltuieli</span>
                <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-white/80">
                  toate filialele
                </span>
              </th>

              <th rowSpan={2} scope="col" style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: '#b45309', color: '#fff',
                border: '1px solid #92400e',
                padding: '6px 12px', textAlign: 'center',
                minWidth: 100, fontWeight: 700, fontSize: 11,
                verticalAlign: 'middle',
              }}>
                <span className="block leading-tight">Total încasări</span>
                <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-white/80">
                  luna aceasta
                </span>
              </th>

              <th rowSpan={2} scope="col" style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: '#1e40af', color: '#fff',
                border: '1px solid #1e3a8a',
                padding: '6px 12px', textAlign: 'center',
                minWidth: 100, fontWeight: 700, fontSize: 11,
                verticalAlign: 'middle',
              }}>
                <span className="block leading-tight">Banca</span>
                <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-white/80">
                  dus la bancă
                </span>
              </th>

              <th rowSpan={2} scope="col" style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: '#b91c1c', color: '#fff',
                border: '1px solid #7f1d1d',
                padding: '6px 12px', textAlign: 'center',
                minWidth: 100, fontWeight: 700, fontSize: 11,
                verticalAlign: 'middle',
              }}>
                <span className="block leading-tight">Cheltuieli total</span>
                <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-white/80">
                  inclusiv banca
                </span>
              </th>

              <th rowSpan={2} scope="col" style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: '#166534', color: '#fff',
                border: '1px solid #14532d',
                padding: '6px 12px', textAlign: 'center',
                minWidth: 100, fontWeight: 700, fontSize: 11,
                verticalAlign: 'middle',
              }}>
                <span className="block leading-tight">Total rămas</span>
                <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-white/80">
                  în seif (cumulat)
                </span>
              </th>
              </>)}
            </tr>

            <tr style={{ height: hRow2, boxShadow: '0 1px 0 0 rgba(15,23,42,0.08)' }}>
              {activeBranches.map((br, i) => {
                const h = hdr(br, i)
                const subCols = [
                  { label: 'Încasare', sub: 'MDL', w: incW  },
                ]
                return (
                  <Fragment key={br}>
                    {subCols.map(({ label, sub, w }) => (
                      <th key={`${br}-${label}`} scope="col" style={{
                        position: 'sticky', top: hRow1, zIndex: 20,
                        background: h, border: borderHd,
                        padding: m ? '3px 4px' : '6px 8px', textAlign: 'center',
                        color: '#1e293b', fontWeight: 600, fontSize: m ? 10 : 11,
                        minWidth: w, letterSpacing: '.01em',
                        verticalAlign: 'middle', lineHeight: 1.25,
                      }}>
                        <span className="block normal-case tracking-tight">{label}</span>
                        {!m && <span className="mt-0.5 block text-[9px] font-normal text-slate-600 normal-case tracking-normal">{sub}</span>}
                      </th>
                    ))}
                  </Fragment>
                )
              })}

              {/* sub-antet cheltuieli comune */}
              {!incomeOnly && [
                { label: 'Avans', sub: 'cheltuieli', w: avW },
                { label: 'Comentarii', sub: 'notă', w: commW },
              ].map(({ label, sub, w }) => (
                <th key={`chelt-${label}`} scope="col" style={{
                  position: 'sticky', top: hRow1, zIndex: 20,
                  background: '#e2e8f0', border: borderHd,
                  padding: m ? '3px 4px' : '6px 8px', textAlign: 'center',
                  color: '#1e293b', fontWeight: 600, fontSize: m ? 10 : 11,
                  minWidth: w, letterSpacing: '.01em',
                  verticalAlign: 'middle', lineHeight: 1.25,
                }}>
                  <span className="block normal-case tracking-tight">{label}</span>
                  {!m && <span className="mt-0.5 block text-[9px] font-normal text-slate-600 normal-case tracking-normal">{sub}</span>}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!incomeOnly && opening !== 0 && (
              <tr style={{ background: '#f0fdf4' }}>
                <td style={{
                  position: 'sticky', left: 0, zIndex: 10,
                  background: '#166534', color: '#f0fdf4',
                  border: '1px solid #14532d',
                  textAlign: 'center', padding: m ? '4px 4px' : '6px 8px',
                  fontWeight: 700, fontSize: m ? 8 : 10,
                  boxShadow: '2px 0 5px rgba(0,0,0,.08)',
                  verticalAlign: 'middle', minWidth: dayW, lineHeight: 1.2,
                }}>
                  Report
                </td>
                <td colSpan={activeBranches.length + 5} style={{
                  border, background: '#f0fdf4', textAlign: 'right',
                  padding: m ? '5px 8px' : '6px 14px', fontSize: m ? 10 : 12,
                  fontWeight: 600, color: '#166534', whiteSpace: 'nowrap',
                }}>
                  Sold reportat din luna precedentă →
                </td>
                <td className="tabular-nums" style={{
                  background: '#dcfce7', border: '1px solid #bbf7d0',
                  textAlign: 'right', padding: '8px 12px',
                  fontWeight: 800, fontSize: 13, minWidth: 100,
                  whiteSpace: 'nowrap', color: opening >= 0 ? '#15803d' : '#b91c1c',
                }}>
                  {fmt(opening) || '0'}
                </td>
              </tr>
            )}
            {days.map(dateStr => {
              const day     = dateStr.slice(8)
              const isToday = dateStr === todayS
              const hd      = activeBranches.some(b => hasCell(day, b))
              const wd      = weekdayShortRo(dateStr)
              const incByBranch = {}
              activeBranches.forEach(b => { incByBranch[b] = parseFloat(getInc(day, b)) || 0 })

              return (
                <tr key={day} className="transition-colors hover:bg-slate-50/80"
                    style={{ background: isToday ? '#EFF6FF' : undefined }}>

                  <td style={{
                    position: 'sticky', left: 0, zIndex: 10,
                    background: isToday ? '#DBEAFE' : '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center', padding: m ? '4px 4px' : '6px 8px',
                    boxShadow: '2px 0 5px rgba(0,0,0,.05)',
                    verticalAlign: 'middle', minWidth: dayW,
                  }}>
                    <span className={`block tabular-nums leading-none ${m ? 'text-[13px]' : 'text-[15px]'} ${isToday ? 'font-extrabold text-blue-700' : 'font-bold text-slate-700'}`}>
                      {day}
                    </span>
                    {!m && <span className={`mt-1 block text-[10px] font-medium capitalize leading-none ${isToday ? 'text-blue-600/90' : 'text-slate-500'}`}>{wd}</span>}
                  </td>

                  {activeBranches.map((br, i) => {
                    const bgc  = bg(br, i)
                    const inc  = getInc(day, br)
                    return (
                      <td key={br} className="align-top" style={{ background: bgc, border, padding: cellP, minWidth: incW }}>
                        <input
                          type="number" min="0" step="0.01" inputMode="decimal"
                          value={inc} placeholder="0"
                          aria-label={`Încasare ${branchTitleCase(br)}, ziua ${day}`}
                          onChange={e => setInc(day, br, e.target.value)}
                          onBlur={e => saveIncOnBlur(day, br, e.target.value)}
                          className={incCls}
                        />
                      </td>
                    )
                  })}

                  {!incomeOnly && (<>
                  {/* Secțiune comună cheltuieli (avans + comentarii) */}
                  <CheltuieliCells
                    key={`chelt-${month}-${day}`}
                    dateStr={`${month}-${day}`}
                    branches={activeBranches}
                    getEntry={getEntry}
                    incByBranch={incByBranch}
                    saveEntry={saveEntry}
                    compact={m}
                    border={border}
                    cellP={cellP}
                    avW={avW}
                    commW={commW}
                    bgc={AVANS_BG}
                  />

                  {/* Total zi (încasări) */}
                  {(() => {
                    const v = incDay(day)
                    return (
                      <td className="tabular-nums" style={{
                        background: v > 0 ? '#fffbeb' : '#fafaf9',
                        border: '1px solid #e7e5e4',
                        textAlign: 'right', padding: '8px 12px',
                        fontWeight: 700, fontSize: 13, minWidth: 100,
                        verticalAlign: 'middle', whiteSpace: 'nowrap',
                        color: v > 0 ? '#b45309' : '#d6d3d1',
                      }} title="Suma încasărilor tuturor filialelor în această zi">
                        {v > 0 ? fmt(v) : '—'}
                      </td>
                    )
                  })()}

                  {/* Banca */}
                  {(() => {
                    const bd = bancaDay(day)
                    return (
                      <td className="tabular-nums" style={{
                        background: bd > 0 ? '#eff6ff' : '#fafaf9',
                        border: '1px solid #bfdbfe',
                        textAlign: 'right', padding: '8px 12px',
                        fontWeight: 700, fontSize: 13, minWidth: 100,
                        verticalAlign: 'middle', whiteSpace: 'nowrap',
                        color: bd > 0 ? '#1d4ed8' : '#d6d3d1',
                      }} title="Sume duse la bancă în această zi">
                        {bd > 0 ? fmt(bd) : '—'}
                      </td>
                    )
                  })()}

                  {/* Cheltuieli total (inclusiv banca) */}
                  {(() => {
                    const v = cheltDay(day)
                    return (
                      <td className="tabular-nums" style={{
                        background: v > 0 ? '#fef2f2' : '#fafaf9',
                        border: '1px solid #fecaca',
                        textAlign: 'right', padding: '8px 12px',
                        fontWeight: 700, fontSize: 13, minWidth: 100,
                        verticalAlign: 'middle', whiteSpace: 'nowrap',
                        color: v > 0 ? '#b91c1c' : '#d6d3d1',
                      }} title="Total cheltuieli (inclusiv sumele duse la bancă)">
                        {v > 0 ? fmt(v) : '—'}
                      </td>
                    )
                  })()}

                  {/* Total rămas — sold cumulat în seif (report + net zile) */}
                  {(() => {
                    const v = runningByDay[day]
                    return (
                      <td className="tabular-nums" style={{
                        background: hd ? '#dcfce7' : '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        textAlign: 'right', padding: '8px 12px',
                        fontWeight: hd ? 800 : 600, fontSize: 13, minWidth: 100,
                        verticalAlign: 'middle', whiteSpace: 'nowrap',
                        color: !hd ? '#d6d3d1' : v >= 0 ? '#15803d' : '#b91c1c',
                      }} title="Sold în seif după această zi (report din lunile precedente + încasări − cheltuieli − banca)">
                        {hd ? (fmt(v) || '0') : '—'}
                      </td>
                    )
                  })()}
                  </>)}
                </tr>
              )
            })}

            <tr className="bg-slate-100/90">
              <td style={{
                position: 'sticky', left: 0, zIndex: 10,
                background: '#334155', color: '#f8fafc',
                border: '1px solid #475569',
                textAlign: 'center', padding: m ? '4px 4px' : '8px 10px',
                fontWeight: 800, fontSize: m ? 9 : 11,
                boxShadow: '2px 0 5px rgba(0,0,0,.1)',
                verticalAlign: 'middle', minWidth: dayW,
              }}>
                <span className="block">{m ? 'Total' : 'Total lună'}</span>
                {!m && <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-wide text-slate-300">pe coloană</span>}
              </td>

              {activeBranches.map((br, i) => {
                const h  = hdr(br, i)
                const ci = colInc(br)
                const hm = ci > 0 || colAv(br) > 0
                const tp = m ? '4px 5px' : '8px 10px'
                const tf = m ? 10 : 12
                return (
                  <td key={br} style={{ background: h, border: borderHd, textAlign: 'right', padding: tp, fontWeight: 700, fontSize: tf, color: '#15803d', whiteSpace: 'nowrap' }}>
                    {hm && ci ? ci.toLocaleString('ro-MD', { maximumFractionDigits: 2 }) : '—'}
                  </td>
                )
              })}

              {!incomeOnly && (<>
              {/* Cheltuieli comune — totalul lunii pe coloana Avans, „—” pe Comentarii */}
              <td style={{ background: AVANS_BG, border: borderHd, textAlign: 'right', padding: m ? '4px 5px' : '8px 10px', fontWeight: 700, fontSize: m ? 10 : 12, color: '#b91c1c', whiteSpace: 'nowrap' }}>
                {avMonth() ? avMonth().toLocaleString('ro-MD', { maximumFractionDigits: 2 }) : '—'}
              </td>
              <td style={{ background: AVANS_BG, border: borderHd, padding: m ? '4px' : '6px', fontSize: 9, color: '#64748b', textAlign: 'center' }}>—</td>

              {/* Total zi (încasări lună) */}
              <td title="Total încasări în lună (toate filialele)" style={{
                background: '#b45309', color: '#fff', border: '1px solid #92400e',
                textAlign: 'right', padding: '8px 12px', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
              }}>
                {hasMonth() ? fmt(incMonth()) : '—'}
              </td>

              {/* Banca lună */}
              <td title="Total dus la bancă în această lună" style={{
                background: '#1e40af', color: '#fff', border: '1px solid #1e3a8a',
                textAlign: 'right', padding: '8px 12px', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
              }}>
                {bancaMonth() > 0 ? fmt(bancaMonth()) : '—'}
              </td>

              {/* Cheltuieli total lună (inclusiv banca) */}
              <td title="Total cheltuieli în lună (inclusiv banca)" style={{
                background: '#b91c1c', color: '#fff', border: '1px solid #7f1d1d',
                textAlign: 'right', padding: '8px 12px', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
              }}>
                {cheltMonth() > 0 ? fmt(cheltMonth()) : '—'}
              </td>

              {/* Total rămas — sold în seif la finalul lunii (report + net lună) */}
              <td title="Sold în seif la finalul lunii = report luna precedentă + încasări − cheltuieli − banca" style={{
                background: '#166534', color: '#fff', border: '1px solid #14532d',
                textAlign: 'right', padding: '8px 12px', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
              }}>
                {(hasMonth() || opening !== 0) ? (fmt(closing) || '0') : '—'}
              </td>
              </>)}
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-2.5">
        <p className="text-xs text-slate-400">
          Toate câmpurile se salvează automat când ieșiți din ele.
        </p>
      </div>

    </div>
  )
}
