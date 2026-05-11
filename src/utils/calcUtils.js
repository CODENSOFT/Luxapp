export function sumBy(transactions, type) {
  return transactions
    .filter(t => t.type === type)
    .reduce((acc, t) => acc + Number(t.amount), 0)
}

export function netProfit(transactions) {
  return sumBy(transactions, 'Venit') - sumBy(transactions, 'Cheltuială')
}

export function byCategory(transactions) {
  const map = {}
  transactions
    .filter(t => t.type === 'Cheltuială')
    .forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount)
    })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

export function byMonthAndType(transactions, months) {
  return months.map(month => {
    const txs = transactions.filter(t => t.date?.startsWith(month))
    return {
      month,
      Venit: sumBy(txs, 'Venit'),
      Cheltuială: sumBy(txs, 'Cheltuială'),
    }
  })
}

export function branchStats(transactions, branches) {
  return branches.map(branch => {
    const txs = transactions.filter(t => t.branch === branch)
    const income = sumBy(txs, 'Venit')
    const expense = sumBy(txs, 'Cheltuială')
    return { branch, income, expense, net: income - expense }
  })
}
