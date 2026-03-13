import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { parseJsonBodySmart } from '../_shared/body.ts'

const supabaseUrl =
  Deno.env.get('SUPABASE_URL') ??
  Deno.env.get('VITE_PUBLIC_SUPABASE_URL') ??
  ''
const secretKey =
  Deno.env.get('SUPABASE_SECRET_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY') ??
  ''

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing Authorization header.' } as const
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    return { error: 'Missing access token.' } as const
  }

  return { token } as const
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

async function insertFreshApiKey(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  nowIso: string,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const apiKey = `osla_${randomHex(24)}`
    const keyHash = await sha256Hex(apiKey)
    const keyPrefix = apiKey.slice(0, 14)

    const { data, error } = await supabase
      .from('os_lunar_agent_api_keys')
      .insert({
        agent_id: agentId,
        name: `regenerated_${nowIso}`,
        key_prefix: keyPrefix,
        key_hash: keyHash,
      })
      .select('id, key_prefix')
      .single()

    if (!error && data) {
      return {
        row: data,
        apiKey,
      }
    }

    if (error?.code !== '23505') {
      throw new Error(error?.message || 'Could not store regenerated API key.')
    }
  }

  throw new Error('Could not generate a unique API key. Retry.')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  if (!supabaseUrl || !secretKey) {
    return json({ error: 'Supabase environment variables are missing.' }, 500)
  }

  const authInfo = getBearerToken(req)
  if ('error' in authInfo) {
    return json({ error: authInfo.error }, 401)
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const body = await parseJsonBodySmart(req) as { agent_id?: string }
    const agentId = String(body?.agent_id ?? '').trim()

    if (!agentId) {
      return json({ error: 'agent_id is required.' }, 400)
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authInfo.token)

    if (userError || !user) {
      return json({ error: 'Could not validate logged in user.' }, 401)
    }

    const { data: human, error: humanError } = await supabase
      .from('os_lunar_humans')
      .select('id, auth_user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (humanError) {
      return json({ error: humanError.message }, 400)
    }

    if (!human) {
      return json({ error: 'No human profile found for this account.' }, 403)
    }

    const { data: claimedOwnership, error: claimError } = await supabase
      .from('os_lunar_agent_claims')
      .select('id, claimed_at')
      .eq('agent_id', agentId)
      .eq('human_id', human.id)
      .eq('status', 'claimed')
      .order('claimed_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (claimError) {
      return json({ error: claimError.message }, 400)
    }

    if (!claimedOwnership) {
      return json({ error: 'You do not own this agent.' }, 403)
    }

    const { data: agent, error: agentError } = await supabase
      .from('os_lunar_agents')
      .select('id, username, owner_human_id')
      .eq('id', agentId)
      .maybeSingle()

    if (agentError) {
      return json({ error: agentError.message }, 400)
    }

    if (!agent) {
      return json({ error: 'Agent not found.' }, 404)
    }

    const { count: activeKeysCountBefore, error: activeCountError } = await supabase
      .from('os_lunar_agent_api_keys')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .is('revoked_at', null)

    if (activeCountError) {
      return json({ error: activeCountError.message }, 400)
    }

    const nowIso = new Date().toISOString()

    const { error: revokeError } = await supabase
      .from('os_lunar_agent_api_keys')
      .update({ revoked_at: nowIso })
      .eq('agent_id', agentId)
      .is('revoked_at', null)

    if (revokeError) {
      return json({ error: revokeError.message }, 400)
    }

    const generated = await insertFreshApiKey(supabase, agentId, nowIso)

    await supabase.from('os_lunar_audit_logs').insert({
      agent_id: agentId,
      human_id: human.id,
      event_type: 'agent_api_key_regenerated',
      entity_type: 'agent_api_key',
      entity_id: generated.row.id,
      payload: {
        auth_user_id: user.id,
        agent_username: agent.username,
        key_prefix: generated.row.key_prefix,
        revoked_keys_count: activeKeysCountBefore ?? 0,
      },
    })

    return json({
      agent_id: agentId,
      api_key: generated.apiKey,
      key_prefix: generated.row.key_prefix,
      generated_at: nowIso,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
