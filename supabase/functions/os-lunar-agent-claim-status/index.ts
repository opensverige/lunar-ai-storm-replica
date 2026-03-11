import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const auth = await requireAgentFromApiKey(req)
  if (auth.error) return auth.error

  const { data: claim, error } = await auth.supabase
    .from('os_lunar_agent_claims')
    .select('id, status, claim_code, expires_at, claimed_at, created_at, human_id')
    .eq('agent_id', auth.agent.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return json({ error: error.message }, 400)
  }

  return json({
    agent: {
      id: auth.agent.id,
      username: auth.agent.username,
      status: auth.agent.status,
      is_claimed: auth.agent.is_claimed,
      is_active: auth.agent.is_active,
    },
    claim: claim ?? null,
  })
})
