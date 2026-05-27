import { useState, useRef, useEffect } from 'react'
import { Lock } from 'lucide-react'

const ACCESS_CODE = '1029384756'

export default function LoginScreen({ onLogin }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (code === ACCESS_CODE) { onLogin() }
    else { setError(true); setCode('') }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-md">
            <Lock size={30} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">LuxWash</h1>
            <p className="text-sm text-gray-500 mt-1">Gestionare financiară</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
          <div className="space-y-1.5">
            <input
              ref={inputRef}
              type="password"
              autoComplete="new-password"
              inputMode="numeric"
              placeholder="Cod de acces"
              value={code}
              onChange={e => { setCode(e.target.value); setError(false) }}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-400 transition-colors tracking-widest ${
                error ? 'border-red-400 bg-red-50 placeholder:text-red-300' : 'border-gray-300 focus:border-blue-400'
              }`}
            />
            {error && (
              <p className="text-xs text-red-500 text-center">Cod incorect. Încercați din nou.</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Intră în aplicație
          </button>
        </form>
      </div>
    </div>
  )
}
