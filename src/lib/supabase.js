import { createClient } from '@supabase/supabase-js'

const url =
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://placeholder.supabase.co'

const key =
  import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder_key'

console.log('Supabase URL:', import.meta.env.VITE_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
console.log('Supabase Publishable Key:', import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'MISSING')

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
