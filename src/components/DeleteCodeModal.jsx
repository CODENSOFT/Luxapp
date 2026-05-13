import { useState, useEffect, useRef } from 'react'
import { ShieldAlert } from 'lucide-react'

export default function DeleteCodeModal({ onConfirm, onCancel }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleConfirm() {
    if (code === '1379') { onConfirm() }
    else { setError(true); setCode('') }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Confirmare ștergere</h3>
            <p className="text-xs text-gray-500 mt-0.5">Introduceți codul de acces pentru a continua.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            placeholder="Cod de acces"
            value={code}
            onChange={e => { setCode(e.target.value); setError(false) }}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onCancel() }}
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-red-300 transition-colors ${
              error ? 'border-red-400 bg-red-50 placeholder:text-red-300' : 'border-gray-300'
            }`}
          />
          {error && <p className="text-xs text-red-500">Cod incorect. Încercați din nou.</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Anulează
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            Șterge
          </button>
        </div>
      </div>
    </div>
  )
}
