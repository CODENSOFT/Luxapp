import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { today } from '../utils/dateUtils'
import { PlusCircle } from 'lucide-react'

export default function EntryForm({ onSaved }) {
  const { branches, categories, addTransaction } = useApp()
  const [form, setForm] = useState({
    branch: '',
    type: 'Venit',
    category: '',
    amount: '',
    date: today(),
    description: '',
  })
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.branch) return setError('Selectați o filială.')
    if (form.type === 'Cheltuială' && !form.category) return setError('Selectați o categorie pentru cheltuială.')
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      return setError('Introduceți o sumă validă.')
    }
    addTransaction({ ...form, amount: Number(form.amount) })
    setForm({ branch: '', type: 'Venit', category: '', amount: '', date: today(), description: '' })
    onSaved?.()
  }

  const fieldCls = "w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide"

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Filială</label>
          <select className={fieldCls} value={form.branch} onChange={e => set('branch', e.target.value)}>
            <option value="">Selectează filiala…</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Tip</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            {['Venit', 'Cheltuială'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  form.type === t
                    ? t === 'Venit' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>
            Categorie
            {form.type === 'Cheltuială' && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select className={fieldCls} value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">{form.type === 'Cheltuială' ? 'Selectează categoria…' : 'Fără categorie (opțional)'}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Sumă (MDL)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={fieldCls}
            placeholder="0.00"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            autoComplete="off"
          />
        </div>

        <div>
          <label className={labelCls}>Data</label>
          <input
            type="date"
            className={fieldCls}
            value={form.date}
            onChange={e => set('date', e.target.value)}
            autoComplete="off"
          />
        </div>

        <div>
          <label className={labelCls}>Descriere (opțional)</label>
          <input
            type="text"
            className={fieldCls}
            placeholder="Adaugă o notă…"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
      >
        <PlusCircle size={16} />
        Salvează
      </button>
    </form>
  )
}
