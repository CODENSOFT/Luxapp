export function today() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('ro-MD', { style: 'currency', currency: 'MDL' }).format(amount)
}

export function getMonthKey(dateStr) {
  return dateStr?.slice(0, 7)
}

export function currentMonthKey() {
  return today().slice(0, 7)
}

export function monthLabel(key) {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' })
}

export function last6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(key)
  }
  return months
}

export function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - day)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function getTodayRange() {
  const t = today()
  return { start: t, end: t }
}

export function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function inRange(dateStr, start, end) {
  if (!start && !end) return true
  if (start && dateStr < start) return false
  if (end && dateStr > end) return false
  return true
}
