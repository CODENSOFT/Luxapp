import { formatCurrency } from '../utils/dateUtils'

export default function StatCard({ title, amount, icon: Icon, color, subtitle }) {
  const colorMap = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  }
  const iconBg = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
  }

  return (
    <div className={`rounded-xl border p-5 flex items-start gap-4 ${colorMap[color]}`}>
      <div className={`p-2.5 rounded-lg ${iconBg[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{title}</p>
        <p className="text-2xl font-bold mt-0.5 truncate">{formatCurrency(amount)}</p>
        {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
      </div>
    </div>
  )
}
