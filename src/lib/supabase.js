import { createClient } from '@supabase/supabase-js'

const url =
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://placeholder.supabase.co'

const key =
  import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder_key'

const AUTH_LOCK_STEAL_MESSAGES = [
  "Lock broken by another request with the 'steal' option",
  'Lock was stolen by another request',
  'The lock request is aborted',
]

const authLockTails = new Map()

function isRecoverableAuthLockError(error) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const lowered = message.toLowerCase()
  return AUTH_LOCK_STEAL_MESSAGES.some((needle) => lowered.includes(needle.toLowerCase()))
}

async function runWithInMemoryAuthLock(name, _acquireTimeout, fn) {
  const previousTail = authLockTails.get(name) ?? Promise.resolve()
  let resolveCurrentTail = () => {}

  const currentTail = new Promise((resolve) => {
    resolveCurrentTail = resolve
  })

  authLockTails.set(name, currentTail)
  await previousTail

  try {
    return await fn()
  } finally {
    resolveCurrentTail()
    if (authLockTails.get(name) === currentTail) {
      authLockTails.delete(name)
    }
  }
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: runWithInMemoryAuthLock,
  },
})

let cachedSession
let hasLoadedSession = false
let sessionRequest = null

async function getSessionWithRetry(maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await supabase.auth.getSession()
    } catch (error) {
      const shouldRetry = isRecoverableAuthLockError(error) && attempt < maxAttempts
      if (!shouldRetry) throw error
      await new Promise((resolve) => globalThis.setTimeout(resolve, 25 * attempt))
    }
  }

  return supabase.auth.getSession()
}

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

  sessionRequest = getSessionWithRetry()
    .then((result) => {
      setCachedSupabaseSession(result.data.session)
      return result
    })
    .finally(() => {
      sessionRequest = null
    })

  return sessionRequest
}
