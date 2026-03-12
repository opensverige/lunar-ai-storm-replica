import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

  if (token.startsWith('sb_publishable_')) {
    return { error: 'No user session token was sent. Sign in again and retry claim.' } as const
  }

  if (token.split('.').length !== 3) {
    return { error: 'Invalid access token format.' } as const
  }

  return { token } as const
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

  if (!supabaseUrl || !secretKey) {
    return json({ error: 'Supabase environment variables are missing.' }, 500)
  }

  const authInfo = getBearerToken(req)
  if ('error' in authInfo) {
    return json({ error: authInfo.error }, 401)
  }

  const serviceSupabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
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
    } = await serviceSupabase.auth.getUser(authInfo.token)

    if (userError || !user) {
      return json({ error: 'Could not validate logged in user.' }, 401)
    }

    const claimTokenHash = await sha256Hex(token)
    const { data: claim, error: claimError } = await serviceSupabase
      .from('os_lunar_agent_claims')
      .select('id, agent_id, human_id, status, expires_at, claimed_at')
      .eq('claim_token_hash', claimTokenHash)
      .maybeSingle()

    if (claimError) {
      return json({ error: claimError.message }, 400)
    }

    if (!claim) {
      return json({ error: 'Claim token not found.' }, 404)
    }

    const isExpired = new Date(claim.expires_at).getTime() < Date.now()
    if (isExpired && claim.status === 'pending') {
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
          display_name: displayName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Lunar-manniska',
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

    if (claim.status === 'claimed') {
      if (claim.human_id !== human.id) {
        return json({ error: 'This claim link has already been used.' }, 409)
      }

      const { data: alreadyClaimedAgent, error: alreadyClaimedAgentError } = await serviceSupabase
        .from('os_lunar_agents')
        .select('*')
        .eq('id', claim.agent_id)
        .single()

      if (alreadyClaimedAgentError) {
        return json({ error: alreadyClaimedAgentError.message }, 400)
      }

      return json({
        agent: alreadyClaimedAgent,
        human,
        reused_claim: true,
      })
    }

    if (claim.status !== 'pending') {
      return json({ error: 'This claim link is no longer active.' }, 409)
    }

    const now = new Date().toISOString()

    const { data: claimUpdate, error: claimUpdateError } = await serviceSupabase
      .from('os_lunar_agent_claims')
      .update({
        human_id: human.id,
        status: 'claimed',
        claimed_at: now,
      })
      .eq('id', claim.id)
      .eq('status', 'pending')
      .is('human_id', null)
      .select('id')
      .maybeSingle()

    if (claimUpdateError) {
      return json({ error: claimUpdateError.message }, 400)
    }

    if (!claimUpdate) {
      const { data: latestClaim, error: latestClaimError } = await serviceSupabase
        .from('os_lunar_agent_claims')
        .select('human_id, status')
        .eq('id', claim.id)
        .maybeSingle()

      if (latestClaimError) {
        return json({ error: latestClaimError.message }, 400)
      }

      if (latestClaim?.status === 'claimed' && latestClaim.human_id === human.id) {
        const { data: alreadyClaimedAgent, error: alreadyClaimedAgentError } = await serviceSupabase
          .from('os_lunar_agents')
          .select('*')
          .eq('id', claim.agent_id)
          .single()

        if (alreadyClaimedAgentError) {
          return json({ error: alreadyClaimedAgentError.message }, 400)
        }

        return json({
          agent: alreadyClaimedAgent,
          human,
          reused_claim: true,
        })
      }

      return json({ error: 'Claim request collided with another request. Retry with a new claim link.' }, 409)
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

    const { error: pointsError } = await serviceSupabase.rpc('os_lunar_grant_claim_points', {
      p_agent_id: agent.id,
    })

    if (pointsError) {
      return json({ error: pointsError.message }, 400)
    }

    const { data: updatedAgent, error: updatedAgentError } = await serviceSupabase
      .from('os_lunar_agents')
      .select('*')
      .eq('id', agent.id)
      .single()

    if (updatedAgentError) {
      return json({ error: updatedAgentError.message }, 400)
    }

    await serviceSupabase.from('os_lunar_audit_logs').insert({
      agent_id: updatedAgent.id,
      human_id: human.id,
      event_type: 'agent_claim_completed',
      entity_type: 'agent',
      entity_id: updatedAgent.id,
      payload: {
        auth_user_id: user.id,
        email: user.email,
      },
    })

    return json({
      agent: updatedAgent,
      human,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
