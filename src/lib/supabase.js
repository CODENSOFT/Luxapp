import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Lipsesc variabilele VITE_SUPABASE_URL și VITE_SUPABASE_ANON_KEY în fișierul .env')
}

export const supabase = createClient(url, key)
