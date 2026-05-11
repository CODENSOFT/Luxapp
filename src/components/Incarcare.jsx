import { Loader2 } from 'lucide-react'

export default function Incarcare() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <p className="text-sm font-medium">Se încarcă datele…</p>
      </div>
    </div>
  )
}
