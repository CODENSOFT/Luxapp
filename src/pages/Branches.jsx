import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'
import { formatCurrency, getMonthRange, getWeekRange, getTodayRange, inRange } from '../utils/dateUtils'
import { sumBy } from '../utils/calcUtils'

const FILTRE = [
  { key: 'luna', label: 'Luna Aceasta' },
  { key: 'saptamana', label: 'Săptămâna Aceasta' },
  { key: 'azi', label: 'Ziua de Azi' },
  { key: 'tot', label: 'Tot Timpul' },
  { key: 'custom', label: 'Personalizat' },
]

export default function Branches({ onMenuClick }) {
  const { transactions, branches } = useApp()
  const [filter, setFilter] = useState('luna')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  function getRange() {
    if (filter === 'luna') return getMonthRange()
    if (filter === 'saptamana') return getWeekRange()
    if (filter === 'azi') return getTodayRange()
    if (filter === 'custom') return { start: customStart, end: customEnd }
    return { start: '', end: '' }
  }

  const { start, end } = getRange()
  const filtered = transactions.filter(t => inRange(t.date, start, end))

  const stats = branches.map(branch => {
    const txs = filtered.filter(t => t.branch === branch)
    const income = sumBy(txs, 'Venit')
    const expense = sumBy(txs, 'Cheltuială')
    return { branch, income, expense, net: income - expense }
  })

  const inputCls = "rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Statistici Filiale" onMenuClick={onMenuClick} />

      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            {FILTRE.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {filter === 'custom' && (
            <>
              <input type="date" className={inputCls} value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span className="text-gray-400 text-sm">până la</span>
              <input type="date" className={inputCls} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.branch} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 truncate">{s.branch}</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Venituri</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(s.income)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Cheltuieli</span>
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(s.expense)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Profit Net</span>
                  <span className={`text-sm font-bold ${s.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(s.net)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Comparație Filiale</h2>
          {stats.every(s => s.income === 0 && s.expense === 0) ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              Nu există date pentru această perioadă.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="branch" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Venituri" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Cheltuieli" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Profit Net" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Filială', 'Total Venituri', 'Total Cheltuieli', 'Profit Net'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.map(s => (
                  <tr key={s.branch} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.branch}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(s.income)}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{formatCurrency(s.expense)}</td>
                    <td className={`px-4 py-3 font-bold ${s.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(s.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
