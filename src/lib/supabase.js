import { createClient } from '@supabase/supabase-js'

const url =
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://placeholder.supabase.co'

const key =
  import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder_key'

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

let cachedSession
let hasLoadedSession = false
let sessionRequest = null

export function setCachedSupabaseSession(session) {
  cachedSession = session ?? null
  hasLoadedSession = true
}

export async function getSupabaseSession({ force = false } = {}) {
  if (!force && hasLoadedSession) {
    return {
      data: {
        session: cachedSession ?? null,
      },
    }
  }

  if (sessionRequest) {
    return sessionRequest
  }

  sessionRequest = supabase.auth
    .getSession()
    .then((result) => {
      setCachedSupabaseSession(result.data.session)
      return result
    })
    .finally(() => {
      sessionRequest = null
    })

  return sessionRequest
}
