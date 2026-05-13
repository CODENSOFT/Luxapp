import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, PlusCircle, Table2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useApp } from '../context/AppContext'
import TopBar from '../components/TopBar'
import StatCard from '../components/StatCard'
import TabelIntrari from '../components/TabelIntrari'
import { formatCurrency, getMonthRange, getWeekRange, getTodayRange, monthLabel, last6Months, inRange } from '../utils/dateUtils'
import SelectorPerioada, { FILTRE } from '../components/SelectorPerioada'

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

function incasariTotal(entries) {
  return entries.reduce((s, e) => s + (Number(e.incasare) || 0), 0)
}

function cheltuieliTotal(entries) {
  return entries.reduce((s, e) =>
    s + (e.expenses || []).reduce((s2, x) => s2 + (Number(x.amount) || 0), 0), 0)
}

function byCategory(entries) {
  const map = {}
  entries.forEach(e => {
    (e.expenses || []).forEach(exp => {
      const key = (exp.comentariu || exp.category || '').trim() || 'Altele'
      if (Number(exp.amount) > 0) map[key] = (map[key] || 0) + Number(exp.amount)
    })
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function byMonthData(entries, months) {
  return months.map(month => {
    const me = entries.filter(e => e.date?.startsWith(month))
    return { month, Venit: incasariTotal(me), Cheltuială: cheltuieliTotal(me) }
  })
}

export default function Dashboard({ onMenuClick }) {
  const { entries, branches } = useApp()
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
  const filtered = entries.filter(e => {
    const inBranch = branchFilter === 'toate' || e.branch === branchFilter
    return inBranch && inRange(e.date, start, end)
  })

  const income = incasariTotal(filtered)
  const expense = cheltuieliTotal(filtered)
  const net = income - expense
  const months = last6Months()
  const monthlyData = byMonthData(entries, months).map(d => ({ ...d, month: monthLabel(d.month) }))
  const pieData = byCategory(filtered)
  const filterLabel = FILTRE.find(f => f.key === filter)?.label ?? ''

  const inputCls = "rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Panou Principal" onMenuClick={onMenuClick} />

      {showForm && <TabelIntrari onClose={() => setShowForm(false)} />}

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <SelectorPerioada value={filter} onChange={setFilter} />
          {filter === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" className={`${inputCls} flex-1 min-w-0`} value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span className="text-gray-400 text-sm shrink-0">până la</span>
              <input type="date" className={`${inputCls} flex-1 min-w-0`} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}
          <div className="flex gap-2 sm:ml-auto">
            <select className={`${inputCls} flex-1 sm:flex-none`} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
              <option value="toate">Toate Filialele</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Table2 size={16} />
              <span>Tabel Principal</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <PlusCircle size={16} />
              <span className="hidden xs:inline">Adaugă Intrare</span>
              <span className="xs:hidden">Adaugă</span>
            </button>
          </div>
        </div>

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
