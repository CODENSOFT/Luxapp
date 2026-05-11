import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Copy, Check } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Incarcare from './components/Incarcare'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Branches from './pages/Branches'
import Settings from './pages/Settings'
import { useApp } from './context/AppContext'
import { supabaseConfigured } from './lib/supabase'

const SQL_CREARE = `create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  branch text not null,
  category text default '',
  amount numeric not null,
  date date not null,
  description text default '',
  created_at timestamptz default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null
);

insert into public.settings (key, value) values
  ('categories', '["Salariu","Vânzări","Chirie","Utilități","Consumabile","Marketing","Altele"]');

alter table public.transactions enable row level security;
alter table public.settings enable row level security;
create policy "Acces total" on public.transactions for all using (true) with check (true);
create policy "Acces total" on public.settings for all using (true) with check (true);`

function ButonCopiere({ text }) {
  const [copiat, setCopiat] = useState(false)
  function copiaza() {
    navigator.clipboard.writeText(text)
    setCopiat(true)
    setTimeout(() => setCopiat(false), 2000)
  }
  return (
    <button
      onClick={copiaza}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
    >
      {copiat ? <Check size={13} /> : <Copy size={13} />}
      {copiat ? 'Copiat!' : 'Copiază SQL'}
    </button>
  )
}

function EcranTabeleNecreate() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 max-w-2xl w-full space-y-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Tabelele din baza de date nu există</h1>
            <p className="text-sm text-gray-500 mt-1">
              Conexiunea la Supabase funcționează, dar tabelele nu au fost create.
              Rulați SQL-ul de mai jos în <strong>Supabase → SQL Editor</strong>.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">SQL de rulat:</p>
            <ButonCopiere text={SQL_CREARE} />
          </div>
          <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 overflow-x-auto whitespace-pre">
            {SQL_CREARE}
          </pre>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold text-blue-800">Pași:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Mergeți la <strong>supabase.com</strong> → proiectul vostru</li>
            <li>Deschideți <strong>SQL Editor</strong> → <strong>New query</strong></li>
            <li>Copiați și lipiți SQL-ul de mai sus</li>
            <li>Apăsați <strong>Run</strong></li>
            <li>Reîncărcați această pagină</li>
          </ol>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Am rulat SQL-ul — Reîncarcă aplicația
        </button>
      </div>
    </div>
  )
}

function EcranConfigurare() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md w-full space-y-4">
        <h1 className="text-lg font-bold text-gray-900">Configurare necesară</h1>
        <p className="text-sm text-gray-500">
          Creați fișierul <code className="bg-gray-100 px-1 rounded">.env</code> în rădăcina proiectului cu:
        </p>
        <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="text-xs text-gray-400">Cheile se găsesc în Supabase → Settings → API</p>
      </div>
    </div>
  )
}

function Continut() {
  const { loading, eroare } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (eroare?.includes('schema cache') || eroare?.includes('relation') || eroare?.includes('does not exist')) {
    return <EcranTabeleNecreate />
  }

  if (eroare) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 max-w-md text-sm space-y-2">
          <p className="font-bold">Eroare la conectare Supabase</p>
          <p>{eroare}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium"
          >
            Reîncearcă
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <Incarcare />

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard onMenuClick={() => setSidebarOpen(true)} />} />
          <Route path="/transactions" element={<Transactions onMenuClick={() => setSidebarOpen(true)} />} />
          <Route path="/branches" element={<Branches onMenuClick={() => setSidebarOpen(true)} />} />
          <Route path="/settings" element={<Settings onMenuClick={() => setSidebarOpen(true)} />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  if (!supabaseConfigured) return <EcranConfigurare />
  return <Continut />
}
