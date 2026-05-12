import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

const FILIALE_IMPLICITE = ['Lunca Bâcului', 'Centru', 'Sîngera', 'Orhei', 'Мойка 5']
const CATEGORII_IMPLICITE = ['Salariu', 'Chirie', 'Utilități', 'Consumabile', 'Combustibil', 'Reparații', 'Marketing', 'Altele']

export function AppProvider({ children }) {
  const [entries, setEntries] = useState([])
  const [branches, setBranches] = useState(FILIALE_IMPLICITE)
  const [categories, setCategories] = useState(CATEGORII_IMPLICITE)
  const [loading, setLoading] = useState(true)
  const [eroare, setEroare] = useState(null)

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .order('date', { ascending: true })
    if (error) { setEroare(error.message); return }
    setEntries(data ?? [])
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
      await Promise.all([fetchEntries(), fetchSettings()])
      setLoading(false)
    }
    init()

    const canal = supabase
      .channel('sync-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_entries' }, fetchEntries)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchSettings)
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [fetchEntries, fetchSettings])

  function getEntry(date, branch) {
    return entries.find(e => e.date === date && e.branch === branch)
  }

  async function saveEntry(date, branch, incasare, expenses) {
    const existing = getEntry(date, branch)
    const payload = { date, branch, incasare: incasare || 0, expenses: expenses || [] }

    if (existing) {
      const { data, error } = await supabase
        .from('daily_entries')
        .update({ incasare: payload.incasare, expenses: payload.expenses })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) { setEroare(error.message); return }
      setEntries(prev => prev.map(e => e.id === existing.id ? data : e))
    } else {
      const { data, error } = await supabase
        .from('daily_entries')
        .insert([payload])
        .select()
        .single()
      if (error) { setEroare(error.message); return }
      setEntries(prev => [...prev, data])
    }
  }

  async function deleteEntry(id) {
    const { error } = await supabase.from('daily_entries').delete().eq('id', id)
    if (error) { setEroare(error.message); return }
    setEntries(prev => prev.filter(e => e.id !== id))
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
      entries,
      branches,
      categories,
      loading,
      eroare,
      getEntry,
      saveEntry,
      deleteEntry,
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
