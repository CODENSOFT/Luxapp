import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

// Filiale fixe — nu se încarcă din baza de date
export const FILIALE_FIXE = [
  'Lunca Bâcului',
  'Centru',
  'Sîngera',
  'Orhei',
  'Мойка 5',
]

const CATEGORII_IMPLICITE = ['Salariu', 'Vânzări', 'Chirie', 'Utilități', 'Consumabile', 'Marketing', 'Altele']

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([])
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

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'categories')
      .single()
    if (error) return // folosim categoriile implicite dacă nu există
    if (data?.value) setCategories(data.value)
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([fetchTransactions(), fetchCategories()])
      setLoading(false)
    }
    init()

    // Sincronizare în timp real
    const canal = supabase
      .channel('sync-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchTransactions)
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [fetchTransactions, fetchCategories])

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

  async function addCategory(name) {
    if (!name || categories.includes(name)) return
    const newList = [...categories, name]
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'categories', value: newList })
    if (error) { setEroare(error.message); return }
    setCategories(newList)
  }

  async function removeCategory(name) {
    const newList = categories.filter(c => c !== name)
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'categories', value: newList })
    if (error) { setEroare(error.message); return }
    setCategories(newList)
  }

  return (
    <AppContext.Provider value={{
      transactions,
      branches: FILIALE_FIXE,
      categories,
      loading,
      eroare,
      addTransaction,
      deleteTransaction,
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
