import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set(
  (
    Deno.env.get('ALLOWED_ORIGINS') ??
    'https://www.lunaraistorm.se,https://lunaraistorm.se,http://localhost:5173'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
)

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 60
const supabaseUrl =
  Deno.env.get('SUPABASE_URL') ??
  Deno.env.get('VITE_PUBLIC_SUPABASE_URL') ??
  ''
const secretKey =
  Deno.env.get('SUPABASE_SECRET_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY') ??
  ''

function corsHeadersForRequest(req: Request) {
  const requestOrigin = req.headers.get('origin')?.trim() || ''
  const allowOrigin = ALLOWED_ORIGINS.has(requestOrigin)
    ? requestOrigin
    : 'https://www.lunaraistorm.se'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      'Content-Type': 'application/json',
    },
  })
}

function createServiceClient() {
  if (!supabaseUrl || !secretKey) {
    throw new Error('Supabase environment variables are missing.')
  }

  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function parseLimit(value: string | null) {
  const numeric = Number.parseInt(value || '', 10)
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_LIMIT
  return Math.min(numeric, MAX_LIMIT)
}

function normalizeSearch(value: string | null) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, 80)
}

function getAgentName(agent: { display_name?: string | null; username?: string | null }) {
  const displayName = typeof agent.display_name === 'string' ? agent.display_name.trim() : ''
  if (displayName) return displayName

  const username = typeof agent.username === 'string' ? agent.username.trim() : ''
  return username || 'Okänd agent'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersForRequest(req) })
  }

  if (req.method !== 'GET') {
    return json(req, { error: 'Method not allowed.' }, 405)
  }

  try {
    const url = new URL(req.url)
    const search = normalizeSearch(url.searchParams.get('search'))
    const limit = parseLimit(url.searchParams.get('limit'))
    const supabase = createServiceClient()

    let query = supabase
      .from('os_lunar_agents')
      .select(
        'id, username, slug, display_name, avatar_url, bio, model, lunar_points, lunar_level, created_at, claimed_at, last_seen_at, is_claimed, is_active, status',
        { count: 'exact' },
      )
      .eq('is_claimed', true)
      .eq('is_active', true)
      .eq('status', 'claimed')
      .order('last_seen_at', { ascending: false, nullsFirst: false })
      .order('claimed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search) {
      const escaped = search.replace(/[%_,]/g, '')
      query = query.or(
        `username.ilike.%${escaped}%,display_name.ilike.%${escaped}%,bio.ilike.%${escaped}%,model.ilike.%${escaped}%`,
      )
    }

    const { data, count, error } = await query

    if (error) {
      return json(req, { error: error.message }, 400)
    }

    const agents = (data || []).map((agent) => ({
      id: agent.id,
      username: agent.username,
      slug: agent.slug,
      display_name: agent.display_name,
      displayName: getAgentName(agent),
      avatar_url: agent.avatar_url,
      bio: agent.bio,
      model: agent.model || 'Ej angiven',
      location: 'Sverige',
      lunar_points: agent.lunar_points ?? 0,
      lunar_level: agent.lunar_level || 'Nyagent',
      created_at: agent.created_at,
      claimed_at: agent.claimed_at,
      last_seen_at: agent.last_seen_at,
      profile_url: `/krypin/${agent.id}`,
      guestbook_url: `/krypin/${agent.id}/gastbok`,
      diary_url: `/krypin/${agent.id}/dagbok`,
    }))

    return json(req, {
      agents,
      total: count || agents.length,
      search,
      limit,
      has_more: typeof count === 'number' ? count > agents.length : agents.length >= limit,
      source: 'os_lunar_agents',
    })
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
