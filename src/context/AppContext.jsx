import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

const FILIALE_IMPLICITE = ['Birou Central', 'Filiala Nord', 'Filiala Sud', 'Filiala Est']
const CATEGORII_IMPLICITE = ['Salariu', 'Vânzări', 'Chirie', 'Utilități', 'Consumabile', 'Marketing', 'Altele']

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState(() => load('fin_transactions', []))
  const [branches, setBranches] = useState(() => load('fin_branches', FILIALE_IMPLICITE))
  const [categories, setCategories] = useState(() => load('fin_categories', CATEGORII_IMPLICITE))

  useEffect(() => {
    localStorage.setItem('fin_transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('fin_branches', JSON.stringify(branches))
  }, [branches])

  useEffect(() => {
    localStorage.setItem('fin_categories', JSON.stringify(categories))
  }, [categories])

  function addTransaction(tx) {
    setTransactions(prev => [{ ...tx, id: crypto.randomUUID() }, ...prev])
  }

  function deleteTransaction(id) {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  function addBranch(name) {
    if (name && !branches.includes(name)) setBranches(prev => [...prev, name])
  }

  function removeBranch(name) {
    setBranches(prev => prev.filter(b => b !== name))
  }

  function addCategory(name) {
    if (name && !categories.includes(name)) setCategories(prev => [...prev, name])
  }

  function removeCategory(name) {
    setCategories(prev => prev.filter(c => c !== name))
  }

  return (
    <AppContext.Provider value={{
      transactions, branches, categories,
      addTransaction, deleteTransaction,
      addBranch, removeBranch,
      addCategory, removeCategory,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp trebuie folosit în AppProvider')
  return ctx
}
