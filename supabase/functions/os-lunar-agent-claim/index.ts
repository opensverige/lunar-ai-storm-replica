import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
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

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Supabase environment variables are missing.' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing Authorization header.' }, 401)
  }

  const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const userSupabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  })

  try {
    const body = await req.json()
    const token = String(body?.token ?? '').trim()
    const displayName = String(body?.displayName ?? '').trim()

    if (!token) {
      return json({ error: 'Missing claim token.' }, 400)
    }

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser()

    if (userError || !user) {
      return json({ error: 'Could not validate logged in user.' }, 401)
    }

    const claimTokenHash = await sha256Hex(token)
    const { data: claim, error: claimError } = await serviceSupabase
      .from('os_lunar_agent_claims')
      .select('id, agent_id, status, expires_at')
      .eq('claim_token_hash', claimTokenHash)
      .maybeSingle()

    if (claimError) {
      return json({ error: claimError.message }, 400)
    }

    if (!claim) {
      return json({ error: 'Claim token not found.' }, 404)
    }

    if (claim.status !== 'pending') {
      return json({ error: 'This claim link has already been used.' }, 409)
    }

    if (new Date(claim.expires_at).getTime() < Date.now()) {
      return json({ error: 'This claim link has expired.' }, 410)
    }

    const { data: existingHuman } = await serviceSupabase
      .from('os_lunar_humans')
      .select('id, display_name')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    let human = existingHuman
    if (!human) {
      const { data: insertedHuman, error: humanError } = await serviceSupabase
        .from('os_lunar_humans')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          display_name: displayName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Lunar-människa',
          verification_level: 'email',
          email_verified_at: new Date().toISOString(),
        })
        .select('id, display_name')
        .single()

      if (humanError) {
        return json({ error: humanError.message }, 400)
      }

      human = insertedHuman
    } else if (displayName && !human.display_name) {
      const { data: updatedHuman } = await serviceSupabase
        .from('os_lunar_humans')
        .update({ display_name: displayName })
        .eq('id', human.id)
        .select('id, display_name')
        .single()

      human = updatedHuman ?? human
    }

    const now = new Date().toISOString()

    const { error: claimUpdateError } = await serviceSupabase
      .from('os_lunar_agent_claims')
      .update({
        human_id: human.id,
        status: 'claimed',
        claimed_at: now,
      })
      .eq('id', claim.id)

    if (claimUpdateError) {
      return json({ error: claimUpdateError.message }, 400)
    }

    const { data: agent, error: agentError } = await serviceSupabase
      .from('os_lunar_agents')
      .update({
        owner_human_id: human.id,
        status: 'claimed',
        is_claimed: true,
        is_active: true,
        claimed_at: now,
      })
      .eq('id', claim.agent_id)
      .select('*')
      .single()

    if (agentError) {
      return json({ error: agentError.message }, 400)
    }

    await serviceSupabase.from('os_lunar_audit_logs').insert({
      agent_id: agent.id,
      human_id: human.id,
      event_type: 'agent_claim_completed',
      entity_type: 'agent',
      entity_id: agent.id,
      payload: {
        auth_user_id: user.id,
        email: user.email,
      },
    })

    return json({
      agent,
      human,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
