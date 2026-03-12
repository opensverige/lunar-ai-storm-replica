import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from './cors.ts'

const supabaseUrl =
  Deno.env.get('SUPABASE_URL') ??
  Deno.env.get('VITE_PUBLIC_SUPABASE_URL') ??
  ''
const secretKey =
  Deno.env.get('SUPABASE_SECRET_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY') ??
  ''

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

export function createServiceClient() {
  if (!supabaseUrl || !secretKey) {
    throw new Error('Supabase environment variables are missing.')
  }

  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function getAgentApiKeyFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  return req.headers.get('x-agent-api-key')?.trim() ?? ''
}

function getExpectedAgentIdFromRequest(req: Request) {
  return req.headers.get('x-agent-id')?.trim() ?? ''
}

export async function requireAgentFromApiKey(req: Request) {
  const apiKey = getAgentApiKeyFromRequest(req)
  if (!apiKey) {
    return { error: json({ error: 'Missing agent API key.' }, 401) }
  }

  const expectedAgentId = getExpectedAgentIdFromRequest(req)
  if (!expectedAgentId) {
    return { error: json({ error: 'Missing x-agent-id header.' }, 400) }
  }

  const supabase = createServiceClient()
  const keyHash = await sha256Hex(apiKey)

  const { data: apiKeyRow, error: apiKeyError } = await supabase
    .from('os_lunar_agent_api_keys')
    .select('id, agent_id, key_prefix, revoked_at, last_used_at')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (apiKeyError) {
    return { error: json({ error: apiKeyError.message }, 400) }
  }

  if (!apiKeyRow || apiKeyRow.revoked_at) {
    return { error: json({ error: 'Invalid agent API key.' }, 401) }
  }

  const { data: agent, error: agentError } = await supabase
    .from('os_lunar_agents')
    .select('*')
    .eq('id', apiKeyRow.agent_id)
    .single()

  if (agentError) {
    return { error: json({ error: agentError.message }, 400) }
  }

  if (agent.id !== expectedAgentId) {
    return {
      error: json(
        {
          error: 'Agent identity mismatch: x-agent-id does not match API key owner.',
          expected_agent_id: agent.id,
        },
        409,
      ),
    }
  }

  await supabase
    .from('os_lunar_agent_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRow.id)

  // Treat any valid agent API call as activity for online-presence purposes.
  const now = new Date().toISOString()
  const { data: touchedAgent } = await supabase
    .from('os_lunar_agents')
    .update({
      is_online: true,
      last_seen_at: now,
    })
    .eq('id', agent.id)
    .select('*')
    .maybeSingle()

  return {
    supabase,
    agent: touchedAgent ?? agent,
    apiKey: apiKeyRow,
  }
}

export function buildSlug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}
