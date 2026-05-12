import { Fragment, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'
import CellModal from '../components/CellModal'
import { today, currentMonthKey, monthDays, formatMonthRo, addMonths } from '../utils/dateUtils'

const PALETTE = [
  { cell: 'bg-pink-50',    head: 'bg-pink-200',    text: 'text-pink-900' },
  { cell: 'bg-sky-50',     head: 'bg-sky-200',     text: 'text-sky-900' },
  { cell: 'bg-emerald-50', head: 'bg-emerald-200', text: 'text-emerald-900' },
  { cell: 'bg-violet-50',  head: 'bg-violet-200',  text: 'text-violet-900' },
  { cell: 'bg-amber-50',   head: 'bg-amber-200',   text: 'text-amber-900' },
  { cell: 'bg-red-50',     head: 'bg-red-200',     text: 'text-red-900' },
  { cell: 'bg-teal-50',    head: 'bg-teal-200',    text: 'text-teal-900' },
]

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

function n(val) {
  if (!val) return ''
  return Number(val).toLocaleString('ro-MD', { maximumFractionDigits: 2 })
}

export default function Dashboard({ onMenuClick }) {
  const { branches, getEntry } = useApp()
  const [month, setMonth] = useState(currentMonthKey)
  const [modal, setModal] = useState(null)

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
    days.forEach(d => {
      const c = calc(d, branch)
      inc += c.inc
      av += c.av
    })
    return { branch, inc, av, net: inc - av }
  })

  const th  = 'border border-gray-400 px-1.5 py-1.5 text-[11px] font-semibold whitespace-nowrap'
  const td  = 'border border-gray-300 px-1.5 py-1 text-xs whitespace-nowrap'
  const tdr = `${td} text-right tabular-nums`

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <TopBar title="LuxWash" onMenuClick={onMenuClick} />

      {modal && (
        <CellModal
          date={modal.date}
          branch={modal.branch}
          onClose={() => setModal(null)}
        />
      )}

      <div className="p-3 sm:p-5">
        {/* Month navigation */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={() => setMonth(m => addMonths(m, -1))}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-base font-bold text-gray-900 min-w-[160px] text-center select-none">
            {formatMonthRo(month)}
          </span>
          <button
            onClick={() => setMonth(m => addMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Excel table */}
        <div className="overflow-x-auto rounded-lg border border-gray-400 shadow-sm bg-white">
          <table className="border-collapse">
            <thead>
              {/* Row 1 – branch names */}
              <tr>
                <th rowSpan={2} className={`${th} bg-blue-900 text-white text-center w-9`}>
                  Zi
                </th>
                {branches.map((branch, i) => (
                  <th
                    key={branch}
                    colSpan={4}
                    className={`${th} ${PALETTE[i % PALETTE.length].head} ${PALETTE[i % PALETTE.length].text} text-center`}
                  >
                    {branch}
                  </th>
                ))}
                <th rowSpan={2} className={`${th} bg-yellow-300 text-yellow-900 text-center`}>
                  Итог за день
                </th>
              </tr>

              {/* Row 2 – sub-column labels */}
              <tr>
                {branches.map((branch, i) => {
                  const pal = PALETTE[i % PALETTE.length]
                  return (
                    <Fragment key={branch}>
                      {['Încasare', 'Avans', 'Comentarii', 'Total'].map(col => (
                        <th
                          key={col}
                          className={`${th} ${pal.head} ${pal.text} text-center font-medium text-[10px]`}
                        >
                          {col}
                        </th>
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
                  <tr key={date}>
                    {/* Day cell */}
                    <td className={`${tdr} text-center font-bold text-[11px] ${isToday ? 'bg-blue-200 text-blue-900' : 'bg-gray-100 text-gray-700'}`}>
                      {day}
                    </td>

                    {rowData.map(({ branch, i, inc, av, exps, net, has }) => {
                      const pal = PALETTE[i % PALETTE.length]
                      const click = () => setModal({ date, branch })
                      return (
                        <Fragment key={branch}>
                          {/* Încasare */}
                          <td
                            className={`${tdr} ${pal.cell} cursor-pointer hover:bg-black/5 min-w-[58px] ${inc && has ? 'text-green-700 font-medium' : 'text-gray-300'}`}
                            onClick={click}
                          >
                            {has && inc ? n(inc) : ''}
                          </td>

                          {/* Avans */}
                          <td
                            className={`${tdr} ${pal.cell} cursor-pointer hover:bg-black/5 min-w-[58px] ${av && has ? 'text-red-600 font-medium' : 'text-gray-300'}`}
                            onClick={click}
                          >
                            {has && av ? n(av) : ''}
                          </td>

                          {/* Comentarii */}
                          <td
                            className={`${td} ${pal.cell} cursor-pointer hover:bg-black/5 min-w-[80px]`}
                            onClick={click}
                          >
                            <div className="flex flex-wrap gap-0.5">
                              {exps.map((exp, j) => exp.category ? (
                                <span
                                  key={j}
                                  className={`inline-block px-1 py-0.5 rounded text-[9px] leading-tight font-medium ${CAT_CLR[exp.category] || 'bg-gray-100 text-gray-600'}`}
                                >
                                  {exp.category}
                                </span>
                              ) : null)}
                            </div>
                          </td>

                          {/* Total */}
                          <td
                            className={`${tdr} ${pal.cell} min-w-[58px] font-semibold ${!has ? '' : net >= 0 ? 'text-green-700' : 'text-red-600'}`}
                          >
                            {has ? n(net) : ''}
                          </td>
                        </Fragment>
                      )
                    })}

                    {/* Daily total */}
                    <td className={`${tdr} bg-yellow-50 font-bold min-w-[68px] text-[11px] ${hasDayData ? (dailyNet >= 0 ? 'text-green-700' : 'text-red-600') : ''}`}>
                      {hasDayData ? n(dailyNet) : ''}
                    </td>
                  </tr>
                )
              })}

              {/* Monthly totals row */}
              <tr className="border-t-2 border-gray-500">
                <td className={`${tdr} text-center font-bold text-[10px] bg-gray-200 text-gray-800`}>
                  TOTAL
                </td>
                {monthlyTotals.map(({ branch, inc, av, net }, i) => {
                  const pal = PALETTE[i % PALETTE.length]
                  const hasM = inc > 0 || av > 0
                  return (
                    <Fragment key={branch}>
                      <td className={`${tdr} ${pal.head} font-bold text-green-700`}>{hasM && inc ? n(inc) : ''}</td>
                      <td className={`${tdr} ${pal.head} font-bold text-red-600`}>{hasM && av ? n(av) : ''}</td>
                      <td className={`${td}  ${pal.head}`} />
                      <td className={`${tdr} ${pal.head} font-bold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {hasM ? n(net) : ''}
                      </td>
                    </Fragment>
                  )
                })}
                {(() => {
                  const grandNet = monthlyTotals.reduce((s, t) => s + t.net, 0)
                  const hasAny = monthlyTotals.some(t => t.inc > 0 || t.av > 0)
                  return (
                    <td className={`${tdr} bg-yellow-200 font-bold text-sm ${grandNet >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {hasAny ? n(grandNet) : ''}
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
