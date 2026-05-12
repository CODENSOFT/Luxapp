import { Fragment, useState } from 'react'
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { currentMonthKey, formatMonthRo, monthDays, addMonths } from '../utils/dateUtils'

const BRANCH_BG   = { 'Lunca Bâcului':'#FFD6D6', 'Centru':'#D6E4FF', 'Sîngera':'#D6FFD6', 'Orhei':'#E8D6FF', 'Мойка 5':'#FFFBD6' }
const BRANCH_HDR  = { 'Lunca Bâcului':'#FFC0C0', 'Centru':'#BFCFFF', 'Sîngera':'#BFEDBA', 'Orhei':'#D5BAFF', 'Мойка 5':'#FFE97A' }
const FALLBACK_BG  = ['#F0F0F0','#E8F4E8','#E8E8F4','#F4ECE8','#ECF4EC']
const FALLBACK_HDR = ['#D8D8D8','#C8E8C8','#C8C8E8','#E4D4C8','#D4E8D4']

function cellBg(br, i)  { return BRANCH_BG[br]  || FALLBACK_BG[i  % FALLBACK_BG.length] }
function cellHdr(br, i) { return BRANCH_HDR[br] || FALLBACK_HDR[i % FALLBACK_HDR.length] }

function loadData(entries, month) {
  const d = {}
  entries.forEach(e => {
    if (!e.date?.startsWith(month)) return
    const day = e.date.slice(8)
    const exp = (e.expenses || [])[0]
    d[`${day}|${e.branch}`] = {
      inc: e.incasare > 0 ? String(e.incasare) : '',
      av:  exp?.amount > 0 ? String(exp.amount) : '',
      com: exp?.comentariu || '',
    }
  })
  return d
}

const ROW1 = 38  // header row 1 height px
const ROW2 = 28  // header row 2 height px

const N  = 'w-full bg-transparent text-right text-xs px-1.5 py-1 outline-none focus:bg-white/80 tabular-nums placeholder-gray-300'
const TI = 'w-full bg-transparent text-xs px-1.5 py-1 outline-none focus:bg-white/80 placeholder-gray-300'

function fmt(n) {
  if (!n) return ''
  const a = Math.abs(n).toLocaleString('ro-MD', { maximumFractionDigits: 2 })
  return n < 0 ? `(${a})` : a
}

export default function TabelIntrari({ onClose }) {
  const { branches, entries, saveEntry } = useApp()
  const [month, setMonth] = useState(currentMonthKey)
  const [data,  setData]  = useState(() => loadData(entries, currentMonthKey()))
  const [saving, setSaving] = useState(false)

  // reload data when month changes
  function changeMonth(delta) {
    const m = addMonths(month, delta)
    setMonth(m)
    setData(loadData(entries, m))
  }

  const days = monthDays(month)

  function get(day, br) { return data[`${day}|${br}`] || { inc: '', av: '', com: '' } }
  function set(day, br, f, v) {
    setData(p => ({ ...p, [`${day}|${br}`]: { ...get(day, br), [f]: v } }))
  }

  function rowNet(day, br) {
    const c = get(day, br)
    return (parseFloat(c.inc) || 0) - (parseFloat(c.av) || 0)
  }
  function daySum(day)   { return branches.reduce((s, b) => s + rowNet(day, b), 0) }
  function colInc(br)    { return days.reduce((s, d) => s + (parseFloat(get(d.slice(8), br).inc) || 0), 0) }
  function colAv(br)     { return days.reduce((s, d) => s + (parseFloat(get(d.slice(8), br).av)  || 0), 0) }
  function colNet(br)    { return colInc(br) - colAv(br) }
  function grandNet()    { return branches.reduce((s, b) => s + colNet(b), 0) }
  function hasCell(day, br) {
    const c = get(day, br)
    return (parseFloat(c.inc) || 0) > 0 || (parseFloat(c.av) || 0) > 0
  }
  function hasDayData(day) { return branches.some(b => hasCell(day, b)) }
  function hasMonthData()  { return branches.some(b => colInc(b) > 0 || colAv(b) > 0) }

  async function handleSave() {
    setSaving(true)
    for (const dateStr of days) {
      const day = dateStr.slice(8)
      for (const br of branches) {
        const c = get(day, br)
        const inc = parseFloat(c.inc) || 0
        const av  = parseFloat(c.av)  || 0
        if (inc > 0 || av > 0) {
          await saveEntry(dateStr, br, inc, av > 0 ? [{ amount: av, category: '', comentariu: c.com }] : [])
        }
      }
    }
    setSaving(false)
    onClose()
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#f8fafc' }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0"
           style={{ background: '#1e3a5f', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}>
        <button onClick={onClose}
                className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)}
                  className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <h1 className="text-white text-sm font-semibold tracking-wide min-w-[160px] text-center select-none">
            Учёт инкассаций и авансов — {formatMonthRo(month)}
          </h1>
          <button onClick={() => changeMonth(1)}
                  className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors">
          <Check size={14} />
          {saving ? 'Salvez…' : 'Salvează'}
        </button>
      </div>

      {/* ── Scrollable table ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{
          borderCollapse: 'collapse',
          fontSize: 12,
          whiteSpace: 'nowrap',
          width: '100%',
        }}>
          <thead>
            {/* ── Row 1: branch names ────────────────────────── */}
            <tr style={{ height: ROW1 }}>
              {/* DATA — rowspan 2, sticky top-left corner */}
              <th rowSpan={2} style={{
                position: 'sticky', top: 0, left: 0, zIndex: 50,
                background: '#1e3a5f', color: '#fff',
                border: '1px solid #334d6e',
                padding: '0 12px', textAlign: 'center',
                minWidth: 46, fontWeight: 700, fontSize: 11,
                boxShadow: '2px 0 4px rgba(0,0,0,.15)',
              }}>DATA</th>

              {branches.map((br, i) => (
                <th key={br} colSpan={4} style={{
                  position: 'sticky', top: 0, zIndex: 20,
                  background: '#1e3a5f', color: '#fff',
                  border: '1px solid #334d6e',
                  padding: '0 10px', textAlign: 'center',
                  fontWeight: 700, letterSpacing: '.04em', fontSize: 11,
                }}>{br.toUpperCase()}</th>
              ))}

              {/* Итог за день — rowspan 2, sticky top */}
              <th rowSpan={2} style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: '#d4a017', color: '#fff',
                border: '1px solid #b8880f',
                padding: '0 10px', textAlign: 'center',
                minWidth: 88, fontWeight: 700, fontSize: 11,
              }}>Итог за день</th>
            </tr>

            {/* ── Row 2: sub-column labels ───────────────────── */}
            <tr style={{ height: ROW2 }}>
              {branches.map((br, i) => {
                const hdr = cellHdr(br, i)
                return (
                  <Fragment key={br}>
                    {[
                      { label: 'Încasare',   w: 76 },
                      { label: 'Avans',      w: 76 },
                      { label: 'Comentarii', w: 110 },
                      { label: 'Total',      w: 76 },
                    ].map(({ label, w }) => (
                      <th key={label} style={{
                        position: 'sticky', top: ROW1, zIndex: 20,
                        background: hdr,
                        border: '1px solid rgba(0,0,0,.12)',
                        padding: '0 6px', textAlign: 'center',
                        color: '#1e293b', fontWeight: 600, fontSize: 10,
                        minWidth: w, letterSpacing: '.02em',
                      }}>{label}</th>
                    ))}
                  </Fragment>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {days.map(dateStr => {
              const day = dateStr.slice(8)
              const isToday = dateStr === today
              const ds = daySum(day)
              const hd = hasDayData(day)
              const rowBg = isToday ? '#EFF6FF' : undefined

              return (
                <tr key={day}
                    style={{ background: rowBg }}
                    className="group hover:brightness-95">

                  {/* Day cell — sticky left */}
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 10,
                    background: isToday ? '#DBEAFE' : '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    textAlign: 'center', padding: '2px 10px',
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? '#1d4ed8' : '#475569',
                    fontSize: 12,
                    boxShadow: '2px 0 4px rgba(0,0,0,.06)',
                  }}>{day}</td>

                  {branches.map((br, i) => {
                    const bg = cellBg(br, i)
                    const c  = get(day, br)
                    const net = rowNet(day, br)
                    const hc  = hasCell(day, br)
                    const cellBorder = '1px solid rgba(0,0,0,.08)'

                    return (
                      <Fragment key={br}>
                        {/* Încasare */}
                        <td style={{ background: bg, border: cellBorder, padding: 0, minWidth: 76 }}>
                          <input type="number" min="0" step="0.01"
                                 value={c.inc} placeholder="—"
                                 onChange={e => set(day, br, 'inc', e.target.value)}
                                 className={N} />
                        </td>
                        {/* Avans */}
                        <td style={{ background: bg, border: cellBorder, padding: 0, minWidth: 76 }}>
                          <input type="number" min="0" step="0.01"
                                 value={c.av} placeholder="—"
                                 onChange={e => set(day, br, 'av', e.target.value)}
                                 className={N} />
                        </td>
                        {/* Comentarii */}
                        <td style={{ background: bg, border: cellBorder, padding: 0, minWidth: 110 }}>
                          <input type="text"
                                 value={c.com} placeholder="…"
                                 onChange={e => set(day, br, 'com', e.target.value)}
                                 className={TI} />
                        </td>
                        {/* Total — read-only */}
                        <td style={{
                          background: bg, border: cellBorder,
                          minWidth: 76, textAlign: 'right',
                          padding: '0 8px', fontWeight: 600,
                          color: !hc ? '#cbd5e1' : net >= 0 ? '#15803d' : '#dc2626',
                        }}>
                          {hc ? fmt(net) : ''}
                        </td>
                      </Fragment>
                    )
                  })}

                  {/* Итог за день */}
                  <td style={{
                    background: hd ? '#FEF9C3' : '#FEFEF0',
                    border: '1px solid rgba(0,0,0,.1)',
                    textAlign: 'right', padding: '0 10px',
                    fontWeight: 700, minWidth: 88,
                    color: !hd ? '#d1d5db' : ds >= 0 ? '#15803d' : '#b91c1c',
                  }}>
                    {hd ? fmt(ds) : ''}
                  </td>
                </tr>
              )
            })}

            {/* ── Totals row ─────────────────────────────────── */}
            <tr style={{ borderTop: '2px solid #94a3b8' }}>
              <td style={{
                position: 'sticky', left: 0, zIndex: 10,
                background: '#334155', color: '#f8fafc',
                border: '1px solid #475569',
                textAlign: 'center', padding: '4px 10px',
                fontWeight: 800, fontSize: 11,
                boxShadow: '2px 0 4px rgba(0,0,0,.1)',
              }}>TOTAL</td>

              {branches.map((br, i) => {
                const bg  = cellHdr(br, i)
                const ci  = colInc(br), ca = colAv(br), cn = colNet(br)
                const hm  = ci > 0 || ca > 0
                return (
                  <Fragment key={br}>
                    <td style={{ background: bg, border: '1px solid rgba(0,0,0,.12)', textAlign: 'right', padding: '4px 8px', fontWeight: 700, color: '#15803d' }}>
                      {hm && ci ? ci.toLocaleString('ro-MD', { maximumFractionDigits: 2 }) : ''}
                    </td>
                    <td style={{ background: bg, border: '1px solid rgba(0,0,0,.12)', textAlign: 'right', padding: '4px 8px', fontWeight: 700, color: '#dc2626' }}>
                      {hm && ca ? ca.toLocaleString('ro-MD', { maximumFractionDigits: 2 }) : ''}
                    </td>
                    <td style={{ background: bg, border: '1px solid rgba(0,0,0,.12)' }} />
                    <td style={{ background: bg, border: '1px solid rgba(0,0,0,.12)', textAlign: 'right', padding: '4px 8px', fontWeight: 800, color: cn >= 0 ? '#15803d' : '#b91c1c' }}>
                      {hm ? fmt(cn) : ''}
                    </td>
                  </Fragment>
                )
              })}

              <td style={{
                background: '#D4A017', color: '#fff',
                border: '1px solid #b8880f',
                textAlign: 'right', padding: '4px 10px',
                fontWeight: 800, fontSize: 13,
              }}>
                {hasMonthData() ? fmt(grandNet()) : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Bottom status bar ────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-2 border-t border-gray-200 bg-white text-xs text-gray-400">
        <span>Click pe celulă pentru a edita · Enter pentru a confirma</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-medium transition-colors">
          Închide
        </button>
      </div>
    </div>
  )
}
