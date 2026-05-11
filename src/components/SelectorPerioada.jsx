const FILTRE = [
  { key: 'luna', label: 'Luna Aceasta' },
  { key: 'saptamana', label: 'Săptămâna Aceasta' },
  { key: 'azi', label: 'Ziua de Azi' },
  { key: 'tot', label: 'Tot Timpul' },
  { key: 'custom', label: 'Personalizat' },
]

export { FILTRE }

export default function SelectorPerioada({ value, onChange }) {
  return (
    <>
      {/* Mobil: dropdown */}
      <select
        className="sm:hidden w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {FILTRE.map(f => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </select>

      {/* Desktop: butoane */}
      <div className="hidden sm:flex rounded-lg overflow-hidden border border-gray-300">
        {FILTRE.map(f => (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              value === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </>
  )
}
