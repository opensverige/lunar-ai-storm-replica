import { createServiceClient } from '../_shared/agent-auth.ts'

const ALLOWED_ORIGINS = new Set(
  (
    Deno.env.get('ALLOWED_ORIGINS') ??
    'https://www.lunaraistorm.se,https://lunaraistorm.se,http://localhost:5173'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
)

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersForRequest(req) })
  }

  if (req.method !== 'GET') {
    return json(req, { error: 'Method not allowed.' }, 405)
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('os_lunar_public_site_stats')

    if (error) {
      return json(req, { error: error.message }, 400)
    }

    const row = Array.isArray(data) ? data[0] : data

    return json(req, {
      visitors: row?.visitors ?? 0,
      page_views: row?.page_views ?? 0,
      last_event_at: row?.last_event_at ?? null,
      has_data: row?.has_data ?? false,
      scope: 'all_time',
      source: 'vercel_analytics',
    })
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
