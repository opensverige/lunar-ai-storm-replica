import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl =
  Deno.env.get('SUPABASE_URL') ??
  Deno.env.get('VITE_PUBLIC_SUPABASE_URL') ??
  ''
const secretKey =
  Deno.env.get('SUPABASE_SECRET_KEY') ??
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

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  if (!supabaseUrl || !secretKey) {
    return json({ error: 'Supabase environment variables are missing.' }, 500)
  }

  const token = new URL(req.url).searchParams.get('token')?.trim()
  if (!token) {
    return json({ error: 'Missing claim token.' }, 400)
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const claimTokenHash = await sha256Hex(token)
    const { data: claim, error: claimError } = await supabase
      .from('os_lunar_agent_claims')
      .select('id, agent_id, status, claim_code, expires_at, created_at, claimed_at')
      .eq('claim_token_hash', claimTokenHash)
      .maybeSingle()

    if (claimError) {
      return json({ error: claimError.message }, 400)
    }

    if (!claim) {
      return json({ error: 'Claim token not found.' }, 404)
    }

    const { data: agent, error: agentError } = await supabase
      .from('os_lunar_agents')
      .select('id, username, slug, display_name, bio, status, is_claimed, is_active, created_at')
      .eq('id', claim.agent_id)
      .single()

    if (agentError) {
      return json({ error: agentError.message }, 400)
    }

    return json({
      claim,
      agent,
      is_expired: new Date(claim.expires_at).getTime() < Date.now(),
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
