import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Incarcare from './components/Incarcare'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Branches from './pages/Branches'
import Settings from './pages/Settings'
import { useApp } from './context/AppContext'
import { supabaseConfigured } from './lib/supabase'

function EcranConfigurare() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-lg w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurare necesară</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aplicația necesită o bază de date Supabase. Urmați pașii de mai jos.
          </p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
            <div>
              <p className="font-semibold text-gray-800">Creați cont Supabase</p>
              <a href="https://supabase.com" target="_blank" rel="noreferrer"
                className="text-blue-600 hover:underline">supabase.com</a>
              {' '}→ Sign Up → New Project
            </div>
          </div>

          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
            <div>
              <p className="font-semibold text-gray-800">Rulați SQL-ul în SQL Editor</p>
              <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap text-gray-700">{`create table public.transactions (
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
  ('branches', '["Birou Central","Filiala Nord","Filiala Sud","Filiala Est"]'),
  ('categories', '["Salariu","Vânzări","Chirie","Utilități","Consumabile","Marketing","Altele"]');

alter table public.transactions enable row level security;
alter table public.settings enable row level security;
create policy "Acces total" on public.transactions for all using (true) with check (true);
create policy "Acces total" on public.settings for all using (true) with check (true);`}</pre>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
            <div>
              <p className="font-semibold text-gray-800">Creați fișierul <code className="bg-gray-100 px-1 rounded">.env</code> în rădăcina proiectului</p>
              <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700">{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}</pre>
              <p className="text-gray-500 mt-1">Cheile se găsesc în Supabase → Settings → API</p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">4</span>
            <div>
              <p className="font-semibold text-gray-800">Reporniți aplicația</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">npm run dev</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Continut() {
  const { loading, eroare } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (eroare) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 max-w-md text-sm">
          <p className="font-bold mb-1">Eroare la conectare Supabase</p>
          <p>{eroare}</p>
          <p className="mt-2 text-red-500">Verificați fișierul .env și reporniți aplicația.</p>
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
