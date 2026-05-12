import { Fragment, useState } from 'react'
import { X, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { currentMonthKey, formatMonthRo } from '../utils/dateUtils'

const BRANCH_BG = {
  'Lunca Bâcului': '#FFD6D6',
  'Centru':        '#D6E4FF',
  'Sîngera':       '#D6FFD6',
  'Orhei':         '#E8D6FF',
  'Мойка 5':       '#FFFBD6',
}
const FALLBACK = ['#F5F5F5','#E8F5E9','#E8EAF6','#FFF3E0','#FCE4EC']
function bg(branch, i) { return BRANCH_BG[branch] || FALLBACK[i % FALLBACK.length] }

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
const H1 = 36  // px height of header row 1
const H2 = 30  // px height of header row 2

function loadExisting(entries, month) {
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

export default function TabelIntrari({ onClose }) {
  const { branches, entries, saveEntry } = useApp()
  const month = currentMonthKey()
  const [data, setData] = useState(() => loadExisting(entries, month))
  const [saving, setSaving] = useState(false)

  function get(day, br) { return data[`${day}|${br}`] || { inc: '', av: '', com: '' } }
  function set(day, br, f, v) {
    const k = `${day}|${br}`
    setData(p => ({ ...p, [k]: { ...get(day, br), [f]: v } }))
  }

  function rowNet(day, br) {
    const c = get(day, br)
    return (parseFloat(c.inc) || 0) - (parseFloat(c.av) || 0)
  }
  function daySum(day) { return branches.reduce((s, b) => s + rowNet(day, b), 0) }
  function colInc(br) { return DAYS.reduce((s, d) => s + (parseFloat(get(d, br).inc) || 0), 0) }
  function colAv(br)  { return DAYS.reduce((s, d) => s + (parseFloat(get(d, br).av) || 0), 0) }
  function colNet(br) { return colInc(br) - colAv(br) }
  function grandNet() { return branches.reduce((s, b) => s + colNet(b), 0) }
  function hasCell(day, br) {
    const c = get(day, br)
    return (parseFloat(c.inc) || 0) > 0 || (parseFloat(c.av) || 0) > 0
  }
  function hasDayData(day) { return branches.some(b => hasCell(day, b)) }

  function fmt(n) {
    if (!n && n !== 0) return ''
    const a = Math.abs(n).toLocaleString('ro-MD', { maximumFractionDigits: 2 })
    return n < 0 ? `(${a})` : a
  }
  function fmtPlain(n) {
    return n ? n.toLocaleString('ro-MD', { maximumFractionDigits: 2 }) : ''
  }

  async function handleSave() {
    setSaving(true)
    for (const day of DAYS) {
      for (const br of branches) {
        const c = get(day, br)
        const inc = parseFloat(c.inc) || 0
        const av  = parseFloat(c.av)  || 0
        if (inc > 0 || av > 0) {
          await saveEntry(
            `${month}-${day}`,
            br,
            inc,
            av > 0 ? [{ amount: av, category: '', comentariu: c.com }] : []
          )
        }
      }
    }
    setSaving(false)
    onClose()
  }

  // ── cell styles ────────────────────────────────────────────────
  const numIn = 'w-full bg-transparent border-0 text-right text-xs px-1 py-1 outline-none focus:bg-blue-50 tabular-nums'
  const txtIn = 'w-full bg-transparent border-0 text-xs px-1 py-1 outline-none focus:bg-blue-50'
  const border = '1px solid #ccc'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">

      {/* ── top bar ──────────────────────────────────────────── */}
      <div style={{ background: '#1e3a5f', flexShrink: 0 }}
           className="flex items-center justify-between px-5 py-2.5">
        <span className="w-7" />
        <h1 className="text-white text-sm font-semibold tracking-wide text-center">
          Учёт инкассаций и авансов — {formatMonthRo(month)}
        </h1>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* ── scrollable table ─────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' }}>
          <thead>
            {/* Row 1 — branch names */}
            <tr style={{ height: H1 }}>
              <th style={{
                position: 'sticky', top: 0, left: 0, zIndex: 40,
                background: '#1e3a5f', color: '#fff',
                border, padding: '0 10px', minWidth: 46,
                boxShadow: '2px 0 0 #aaa',
              }}>
                DATA
              </th>
              {branches.map((br, i) => (
                <th key={br} colSpan={4} style={{
                  position: 'sticky', top: 0, zIndex: 20,
                  background: '#1e3a5f', color: '#fff',
                  border, padding: '0 8px', textAlign: 'center',
                  fontWeight: 700, letterSpacing: '0.03em',
                }}>
                  {br.toUpperCase()}
                </th>
              ))}
              <th style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: '#FFD700', color: '#000',
                border, padding: '0 8px', textAlign: 'center',
                minWidth: 82, fontWeight: 700,
              }}>
                Итог за день
              </th>
            </tr>

            {/* Row 2 — sub-column labels */}
            <tr style={{ height: H2 }}>
              {branches.map((br, i) => {
                const c = bg(br, i)
                return (
                  <Fragment key={br}>
                    {['Încasare', 'Avans', 'Comentarii', 'Total'].map(col => (
                      <th key={col} style={{
                        position: 'sticky', top: H1, zIndex: 20,
                        background: c, border,
                        padding: '0 6px', textAlign: 'center',
                        color: '#374151', fontWeight: 600,
                        minWidth: col === 'Comentarii' ? 100 : col === 'Total' ? 68 : 70,
                      }}>
                        {col}
                      </th>
                    ))}
                  </Fragment>
                )
              })}
              {/* Empty under "Итог за день" rowspan */}
            </tr>
          </thead>

          <tbody>
            {DAYS.map(day => {
              const ds = daySum(day)
              const hd = hasDayData(day)
              return (
                <tr key={day}>
                  {/* Day cell — sticky left */}
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 10,
                    background: '#f3f4f6',
                    border, textAlign: 'center',
                    fontWeight: 700, color: '#374151',
                    padding: '0 8px',
                    boxShadow: '2px 0 0 #aaa',
                  }}>
                    {day}
                  </td>

                  {branches.map((br, i) => {
                    const c = get(day, br)
                    const net = rowNet(day, br)
                    const hc  = hasCell(day, br)
                    const bgc = bg(br, i)
                    return (
                      <Fragment key={br}>
                        {/* Încasare */}
                        <td style={{ background: bgc, border, padding: 0 }}>
                          <input type="number" min="0" step="0.01"
                            value={c.inc}
                            onChange={e => set(day, br, 'inc', e.target.value)}
                            className={numIn} />
                        </td>
                        {/* Avans */}
                        <td style={{ background: bgc, border, padding: 0 }}>
                          <input type="number" min="0" step="0.01"
                            value={c.av}
                            onChange={e => set(day, br, 'av', e.target.value)}
                            className={numIn} />
                        </td>
                        {/* Comentarii */}
                        <td style={{ background: bgc, border, padding: 0 }}>
                          <input type="text"
                            value={c.com}
                            onChange={e => set(day, br, 'com', e.target.value)}
                            className={txtIn} />
                        </td>
                        {/* Total */}
                        <td style={{
                          background: bgc, border,
                          textAlign: 'right', padding: '0 6px',
                          fontWeight: 600,
                          color: !hc ? '#d1d5db' : net >= 0 ? '#15803d' : '#dc2626',
                        }}>
                          {hc ? fmt(net) : ''}
                        </td>
                      </Fragment>
                    )
                  })}

                  {/* Итог за день */}
                  <td style={{
                    background: '#FFFDE7', border,
                    textAlign: 'right', padding: '0 8px',
                    fontWeight: 700,
                    color: !hd ? '#d1d5db' : ds >= 0 ? '#15803d' : '#b91c1c',
                  }}>
                    {hd ? fmt(ds) : ''}
                  </td>
                </tr>
              )
            })}

            {/* ── TOTAL row ─────────────────────────────────── */}
            <tr style={{ borderTop: '2px solid #374151' }}>
              <td style={{
                position: 'sticky', left: 0, zIndex: 10,
                background: '#d1d5db', border: '1px solid #9ca3af',
                textAlign: 'center', padding: '2px 8px',
                fontWeight: 800, color: '#111827',
                boxShadow: '2px 0 0 #aaa',
              }}>
                TOTAL
              </td>
              {branches.map((br, i) => {
                const bgc = bg(br, i)
                const ci = colInc(br), ca = colAv(br), cn = colNet(br)
                const hm = ci > 0 || ca > 0
                return (
                  <Fragment key={br}>
                    <td style={{ background: bgc, border: '1px solid #9ca3af', textAlign: 'right', padding: '3px 6px', fontWeight: 700, color: '#15803d' }}>
                      {hm && ci ? fmtPlain(ci) : ''}
                    </td>
                    <td style={{ background: bgc, border: '1px solid #9ca3af', textAlign: 'right', padding: '3px 6px', fontWeight: 700, color: '#dc2626' }}>
                      {hm && ca ? fmtPlain(ca) : ''}
                    </td>
                    <td style={{ background: bgc, border: '1px solid #9ca3af' }} />
                    <td style={{
                      background: bgc, border: '1px solid #9ca3af',
                      textAlign: 'right', padding: '3px 6px', fontWeight: 700,
                      color: cn >= 0 ? '#15803d' : '#b91c1c',
                    }}>
                      {hm ? fmt(cn) : ''}
                    </td>
                  </Fragment>
                )
              })}
              {(() => {
                const gn = grandNet()
                const hg = branches.some(b => colInc(b) > 0 || colAv(b) > 0)
                return (
                  <td style={{
                    background: '#FFD700', border: '1px solid #9ca3af',
                    textAlign: 'right', padding: '3px 8px',
                    fontWeight: 800, fontSize: 13,
                    color: gn >= 0 ? '#14532d' : '#7f1d1d',
                  }}>
                    {hg ? fmt(gn) : ''}
                  </td>
                )
              })()}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── footer ───────────────────────────────────────────── */}
      <div style={{ flexShrink: 0 }}
           className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white">
        <button onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
          Anulează
        </button>
        <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
          <Check size={16} />
          {saving ? 'Se salvează…' : 'Salvează'}
        </button>
      </div>
    </div>
  )
}
