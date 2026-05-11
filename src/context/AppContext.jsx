import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

const FILIALE_IMPLICITE = ['Lunca Bâcului', 'Centru', 'Sîngera', 'Orhei', 'Мойка 5']
const CATEGORII_IMPLICITE = ['Salariu', 'Vânzări', 'Chirie', 'Utilități', 'Consumabile', 'Marketing', 'Altele']

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([])
  const [branches, setBranches] = useState(FILIALE_IMPLICITE)
  const [categories, setCategories] = useState(CATEGORII_IMPLICITE)
  const [loading, setLoading] = useState(true)
  const [eroare, setEroare] = useState(null)

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) { setEroare(error.message); return }
    setTransactions(data ?? [])
  }, [])

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('*')
    if (error) return
    const b = data?.find(s => s.key === 'branches')
    const c = data?.find(s => s.key === 'categories')
    if (b?.value) setBranches(b.value)
    if (c?.value) setCategories(c.value)
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([fetchTransactions(), fetchSettings()])
      setLoading(false)
    }
    init()

    const canal = supabase
      .channel('sync-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchTransactions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchSettings)
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [fetchTransactions, fetchSettings])

  async function addTransaction(tx) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...tx }])
      .select()
      .single()
    if (error) { setEroare(error.message); return }
    setTransactions(prev => [data, ...prev])
  }

  async function deleteTransaction(id) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    if (error) { setEroare(error.message); return }
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  async function saveBranches(newList) {
    const { error } = await supabase.from('settings').upsert({ key: 'branches', value: newList })
    if (error) { setEroare(error.message); return }
    setBranches(newList)
  }

  async function saveCategories(newList) {
    const { error } = await supabase.from('settings').upsert({ key: 'categories', value: newList })
    if (error) { setEroare(error.message); return }
    setCategories(newList)
  }

  function addBranch(name) {
    if (name && !branches.includes(name)) saveBranches([...branches, name])
  }

  function removeBranch(name) {
    saveBranches(branches.filter(b => b !== name))
  }

  function addCategory(name) {
    if (name && !categories.includes(name)) saveCategories([...categories, name])
  }

  function removeCategory(name) {
    saveCategories(categories.filter(c => c !== name))
  }

  return (
    <AppContext.Provider value={{
      transactions,
      branches,
      categories,
      loading,
      eroare,
      addTransaction,
      deleteTransaction,
      addBranch,
      removeBranch,
      addCategory,
      removeCategory,
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
