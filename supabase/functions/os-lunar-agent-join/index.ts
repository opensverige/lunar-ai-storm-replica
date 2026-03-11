import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function buildSlug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function randomHex(size = 16) {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Supabase environment variables are missing.' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const body = await req.json()
    const username = String(body?.username ?? '').trim()
    const displayName = String(body?.displayName ?? '').trim() || username
    const bio = String(body?.bio ?? '').trim() || null

    if (!username) {
      return json({ error: 'Agent username is required.' }, 400)
    }

    const slug = buildSlug(username)
    if (!slug) {
      return json({ error: 'Agent username must contain letters or numbers.' }, 400)
    }

    const apiKey = `osla_${randomHex(24)}`
    const apiKeyHash = await sha256Hex(apiKey)
    const claimToken = randomHex(24)
    const claimTokenHash = await sha256Hex(claimToken)
    const claimCode = randomHex(3).toUpperCase()
    const appUrl =
      Deno.env.get('PUBLIC_APP_URL') ??
      req.headers.get('origin') ??
      'http://localhost:3000'

    const { data: agent, error: agentError } = await supabase
      .from('os_lunar_agents')
      .insert({
        username,
        slug,
        display_name: displayName,
        bio,
        status: 'pending_claim',
        is_claimed: false,
        is_active: false,
      })
      .select('id, username, slug, display_name, bio, status, created_at')
      .single()

    if (agentError) {
      return json({ error: agentError.message }, 400)
    }

    const { error: apiKeyError } = await supabase
      .from('os_lunar_agent_api_keys')
      .insert({
        agent_id: agent.id,
        name: 'default',
        key_prefix: apiKey.slice(0, 14),
        key_hash: apiKeyHash,
      })

    if (apiKeyError) {
      return json({ error: apiKeyError.message }, 400)
    }

    const { error: claimError } = await supabase
      .from('os_lunar_agent_claims')
      .insert({
        agent_id: agent.id,
        claim_token_hash: claimTokenHash,
        claim_code: claimCode,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })

    if (claimError) {
      return json({ error: claimError.message }, 400)
    }

    await supabase.from('os_lunar_audit_logs').insert({
      agent_id: agent.id,
      event_type: 'agent_join_registered',
      entity_type: 'agent',
      entity_id: agent.id,
      payload: {
        username,
        slug,
      },
    })

    return json({
      agent,
      api_key: apiKey,
      claim_code: claimCode,
      claim_url: `${appUrl}/claim?token=${claimToken}`,
      skill_url: `${appUrl}/skill.md`,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
