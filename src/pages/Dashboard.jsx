import { Fragment, useState } from 'react'
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'
import TabelIntrari from '../components/TabelIntrari'
import { today, currentMonthKey, monthDays, formatMonthRo, addMonths } from '../utils/dateUtils'

const BRANCH_BG = {
  'Lunca Bâcului': '#FFD6D6',
  'Centru':        '#D6E4FF',
  'Sîngera':       '#D6FFD6',
  'Orhei':         '#E8D6FF',
  'Мойка 5':       '#FFFBD6',
}
const FALLBACK = ['#F5F5F5','#E8F5E9','#E8EAF6','#FFF3E0','#FCE4EC']
function branchBg(branch, i) { return BRANCH_BG[branch] || FALLBACK[i % FALLBACK.length] }

const CAT_CLR = {
  'Salariu':     'bg-blue-100 text-blue-700',
  'Chirie':      'bg-violet-100 text-violet-700',
  'Utilități':   'bg-orange-100 text-orange-700',
  'Consumabile': 'bg-emerald-100 text-emerald-700',
  'Combustibil': 'bg-amber-100 text-amber-700',
  'Reparații':   'bg-red-100 text-red-700',
  'Marketing':   'bg-pink-100 text-pink-700',
  'Altele':      'bg-gray-100 text-gray-600',
}

function num(n) {
  if (!n) return ''
  return Number(n).toLocaleString('ro-MD', { maximumFractionDigits: 2 })
}
function fmtNet(n, hasData) {
  if (!hasData) return ''
  const a = Math.abs(n).toLocaleString('ro-MD', { maximumFractionDigits: 2 })
  return n < 0 ? `(${a})` : a
}

const H1 = 36
const H2 = 30
const border = '1px solid #ccc'

export default function Dashboard({ onMenuClick }) {
  const { branches, getEntry } = useApp()
  const [month, setMonth] = useState(currentMonthKey)
  const [showForm, setShowForm] = useState(false)

  const days = monthDays(month)
  const todayStr = today()

  function calc(date, branch) {
    const e = getEntry(date, branch)
    if (!e) return { inc: 0, av: 0, exps: [], net: 0, has: false }
    const av = (e.expenses || []).reduce((s, x) => s + (Number(x.amount) || 0), 0)
    const inc = Number(e.incasare) || 0
    return { inc, av, exps: e.expenses || [], net: inc - av, has: true }
  }

  const monthlyTotals = branches.map(branch => {
    let inc = 0, av = 0
    days.forEach(d => { const c = calc(d, branch); inc += c.inc; av += c.av })
    return { branch, inc, av, net: inc - av }
  })

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Panou Principal" onMenuClick={onMenuClick} />

      {showForm && <TabelIntrari onClose={() => setShowForm(false)} />}

      <div className="p-3 sm:p-4">
        {/* Controls row */}
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth(m => addMonths(m, -1))}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-900 min-w-[130px] text-center select-none">
              {formatMonthRo(month)}
            </span>
            <button
              onClick={() => setMonth(m => addMonths(m, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={15} />
            Adaugă Intrare
          </button>
        </div>

        {/* Excel table */}
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' }}>
            <thead>
              {/* Row 1 — branch names */}
              <tr style={{ height: H1 }}>
                <th style={{
                  position: 'sticky', top: 0, left: 0, zIndex: 40,
                  background: '#1e3a5f', color: '#fff',
                  border, padding: '0 10px', minWidth: 44,
                  boxShadow: '2px 0 0 #aaa',
                }}>DATA</th>
                {branches.map((branch, i) => (
                  <th key={branch} colSpan={4} style={{
                    position: 'sticky', top: 0, zIndex: 20,
                    background: '#1e3a5f', color: '#fff',
                    border, padding: '0 8px', textAlign: 'center',
                    fontWeight: 700,
                  }}>
                    {branch.toUpperCase()}
                  </th>
                ))}
                <th style={{
                  position: 'sticky', top: 0, zIndex: 20,
                  background: '#FFD700', color: '#000',
                  border, padding: '0 8px', textAlign: 'center',
                  minWidth: 82, fontWeight: 700,
                }}>Итог за день</th>
              </tr>

              {/* Row 2 — sub-columns */}
              <tr style={{ height: H2 }}>
                {branches.map((branch, i) => {
                  const bg = branchBg(branch, i)
                  return (
                    <Fragment key={branch}>
                      {['Încasare', 'Avans', 'Comentarii', 'Total'].map(col => (
                        <th key={col} style={{
                          position: 'sticky', top: H1, zIndex: 20,
                          background: bg, border,
                          padding: '0 6px', textAlign: 'center',
                          color: '#374151', fontWeight: 600,
                          minWidth: col === 'Comentarii' ? 100 : col === 'Total' ? 68 : 68,
                        }}>{col}</th>
                      ))}
                    </Fragment>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {days.map(date => {
                const day = date.slice(8)
                const isToday = date === todayStr
                const rowData = branches.map((branch, i) => ({ branch, i, ...calc(date, branch) }))
                const dailyNet = rowData.reduce((s, d) => s + d.net, 0)
                const hasDayData = rowData.some(d => d.has)

                return (
                  <tr key={date} style={{ background: isToday ? '#EFF6FF' : undefined }}>
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 10,
                      background: isToday ? '#DBEAFE' : '#F9FAFB',
                      border, textAlign: 'center', padding: '0 8px',
                      fontWeight: 700, color: isToday ? '#1d4ed8' : '#374151',
                      boxShadow: '2px 0 0 #aaa',
                    }}>{day}</td>

                    {rowData.map(({ branch, i, inc, av, exps, net, has }) => {
                      const bg = branchBg(branch, i)
                      return (
                        <Fragment key={branch}>
                          <td style={{ background: bg, border, textAlign: 'right', padding: '2px 6px', color: inc && has ? '#15803d' : '#d1d5db', fontWeight: inc && has ? 600 : 400 }}>
                            {has && inc ? num(inc) : ''}
                          </td>
                          <td style={{ background: bg, border, textAlign: 'right', padding: '2px 6px', color: av && has ? '#dc2626' : '#d1d5db', fontWeight: av && has ? 600 : 400 }}>
                            {has && av ? num(av) : ''}
                          </td>
                          <td style={{ background: bg, border, padding: '2px 4px', maxWidth: 110 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                              {exps.map((exp, j) => exp.category ? (
                                <span key={j} className={`inline-block px-1 py-0.5 rounded text-[9px] leading-tight font-medium ${CAT_CLR[exp.category] || 'bg-gray-100 text-gray-600'}`}>
                                  {exp.category}
                                </span>
                              ) : null)}
                            </div>
                          </td>
                          <td style={{
                            background: bg, border,
                            textAlign: 'right', padding: '2px 6px',
                            fontWeight: 600,
                            color: !has ? '#d1d5db' : net >= 0 ? '#15803d' : '#dc2626',
                          }}>
                            {fmtNet(net, has)}
                          </td>
                        </Fragment>
                      )
                    })}

                    <td style={{
                      background: hasDayData ? '#FFFDE7' : '#FFFFF0',
                      border, textAlign: 'right', padding: '2px 8px',
                      fontWeight: 700,
                      color: !hasDayData ? '#d1d5db' : dailyNet >= 0 ? '#15803d' : '#b91c1c',
                    }}>
                      {hasDayData ? fmtNet(dailyNet, true) : ''}
                    </td>
                  </tr>
                )
              })}

              {/* Totals row */}
              <tr style={{ borderTop: '2px solid #374151' }}>
                <td style={{
                  position: 'sticky', left: 0, zIndex: 10,
                  background: '#E5E7EB', border: '1px solid #9CA3AF',
                  textAlign: 'center', padding: '3px 8px',
                  fontWeight: 800, color: '#111827',
                  boxShadow: '2px 0 0 #aaa',
                }}>TOTAL</td>
                {monthlyTotals.map(({ branch, inc, av, net }, i) => {
                  const bg = branchBg(branch, i)
                  const hm = inc > 0 || av > 0
                  return (
                    <Fragment key={branch}>
                      <td style={{ background: bg, border: '1px solid #9CA3AF', textAlign: 'right', padding: '3px 6px', fontWeight: 700, color: '#15803d' }}>
                        {hm && inc ? num(inc) : ''}
                      </td>
                      <td style={{ background: bg, border: '1px solid #9CA3AF', textAlign: 'right', padding: '3px 6px', fontWeight: 700, color: '#dc2626' }}>
                        {hm && av ? num(av) : ''}
                      </td>
                      <td style={{ background: bg, border: '1px solid #9CA3AF' }} />
                      <td style={{ background: bg, border: '1px solid #9CA3AF', textAlign: 'right', padding: '3px 6px', fontWeight: 700, color: net >= 0 ? '#15803d' : '#b91c1c' }}>
                        {hm ? fmtNet(net, true) : ''}
                      </td>
                    </Fragment>
                  )
                })}
                {(() => {
                  const gn = monthlyTotals.reduce((s, t) => s + t.net, 0)
                  const hg = monthlyTotals.some(t => t.inc > 0 || t.av > 0)
                  return (
                    <td style={{ background: '#FFD700', border: '1px solid #9CA3AF', textAlign: 'right', padding: '3px 8px', fontWeight: 800, fontSize: 13, color: gn >= 0 ? '#14532d' : '#7f1d1d' }}>
                      {hg ? fmtNet(gn, true) : ''}
                    </td>
                  )
                })()}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
