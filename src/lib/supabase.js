import { createClient } from '@supabase/supabase-js'

const url =
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://placeholder.supabase.co'

const key =
  import.meta.env.VITE_PUBLIC_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder_key'

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
