import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Building2 } from 'lucide-react'

/**
 * Selector de filiale cu bifare (multi-select).
 * `value` = listă de filiale selectate. Listă goală sau toate bifate = „Toate Filialele".
 */
export default function BranchMultiSelect({ branches, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const allSelected = value.length === 0 || value.length === branches.length

  function toggleBranch(br) {
    // Dacă suntem pe „Toate", un click pornește o selecție nouă cu DOAR filiala apăsată
    if (value.length === 0) {
      onChange([br])
      return
    }
    const next = value.includes(br) ? value.filter(b => b !== br) : [...value, br]
    // Nicio filială bifată => revenim la „Toate". Toate bifate => normalizăm la „Toate".
    if (next.length === 0 || next.length === branches.length) {
      onChange([])
      return
    }
    onChange(next)
  }

  function selectAll() {
    onChange([])
  }

  let label
  if (allSelected) label = 'Toate Filialele'
  else if (value.length === 1) label = value[0]
  else label = `${value.length} filiale`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
      >
        <Building2 size={15} className="text-gray-400 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown size={15} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-60 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={selectAll}
            className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
          >
            <span className={allSelected ? 'font-semibold text-blue-600' : 'text-gray-700'}>
              Toate Filialele
            </span>
            {allSelected && <Check size={15} className="text-blue-600" />}
          </button>
          <div className="my-1 border-t border-gray-100" />
          {branches.map(br => {
            const checked = !allSelected && value.includes(br)
            return (
              <button
                key={br}
                type="button"
                onClick={() => toggleBranch(br)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}>
                    {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className={checked ? 'text-gray-900' : 'text-gray-600'}>{br}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
