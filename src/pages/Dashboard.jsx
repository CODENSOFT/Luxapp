import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, PlusCircle, X } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'
import StatCard from '../components/StatCard'
import EntryForm from '../components/EntryForm'
import { formatCurrency, getMonthRange, getWeekRange, getTodayRange, monthLabel, last6Months, inRange } from '../utils/dateUtils'
import { sumBy, netProfit, byCategory, byMonthAndType } from '../utils/calcUtils'

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

const FILTRE = [
  { key: 'luna', label: 'Luna Aceasta' },
  { key: 'saptamana', label: 'Săptămâna Aceasta' },
  { key: 'azi', label: 'Ziua de Azi' },
  { key: 'tot', label: 'Tot Timpul' },
  { key: 'custom', label: 'Personalizat' },
]

export default function Dashboard({ onMenuClick }) {
  const { transactions, branches } = useApp()
  const [filter, setFilter] = useState('luna')
  const [branchFilter, setBranchFilter] = useState('toate')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showForm, setShowForm] = useState(false)

  function getRange() {
    if (filter === 'luna') return getMonthRange()
    if (filter === 'saptamana') return getWeekRange()
    if (filter === 'azi') return getTodayRange()
    if (filter === 'custom') return { start: customStart, end: customEnd }
    return { start: '', end: '' }
  }

  const { start, end } = getRange()
  const filtered = transactions.filter(t => {
    const inBranch = branchFilter === 'toate' || t.branch === branchFilter
    return inBranch && inRange(t.date, start, end)
  })

  const income = sumBy(filtered, 'Venit')
  const expense = sumBy(filtered, 'Cheltuială')
  const net = netProfit(filtered)
  const months = last6Months()
  const monthlyData = byMonthAndType(transactions, months).map(d => ({ ...d, month: monthLabel(d.month) }))
  const pieData = byCategory(filtered)
  const filterLabel = FILTRE.find(f => f.key === filter)?.label ?? ''

  const inputCls = "rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Panou Principal" onMenuClick={onMenuClick} />

      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
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
          <select className={inputCls} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="toate">Toate Filialele</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Venituri" amount={income} icon={TrendingUp} color="green" subtitle={filterLabel} />
          <StatCard title="Total Cheltuieli" amount={expense} icon={TrendingDown} color="red" subtitle={filterLabel} />
          <StatCard title="Profit Net" amount={net} icon={DollarSign} color={net >= 0 ? 'blue' : 'red'} subtitle={filterLabel} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Venituri vs Cheltuieli — Ultimele 6 Luni</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Venit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cheltuială" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Cheltuieli pe Categorie</h2>
            {pieData.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
                Nu există date despre cheltuieli
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-2 space-y-1">
                  {pieData.map((d, i) => (
                    <li key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-gray-600">{d.name}</span>
                      </span>
                      <span className="font-medium text-gray-800">{formatCurrency(d.value)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
