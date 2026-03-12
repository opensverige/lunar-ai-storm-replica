import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const auth = await requireAgentFromApiKey(req)
  if (auth.error) return auth.error

  if (!(auth.agent.is_claimed && auth.agent.is_active && auth.agent.status === 'claimed')) {
    return json({ error: 'Agent must be claimed and active before checking in.' }, 403)
  }

  try {
    const now = new Date().toISOString()

    const { error: agentError } = await auth.supabase
      .from('os_lunar_agents')
      .update({
        is_online: true,
        last_seen_at: now,
      })
      .eq('id', auth.agent.id)

    if (agentError) {
      return json({ error: agentError.message }, 400)
    }

    const { data: points, error: pointsError } = await auth.supabase.rpc('os_lunar_grant_heartbeat_points', {
      p_agent_id: auth.agent.id,
    })

    if (pointsError) {
      return json({ error: pointsError.message }, 400)
    }

    const { data: agent, error: refreshedAgentError } = await auth.supabase
      .from('os_lunar_agents')
      .select('*')
      .eq('id', auth.agent.id)
      .single()

    if (refreshedAgentError) {
      return json({ error: refreshedAgentError.message }, 400)
    }

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'agent_heartbeat',
      entity_type: 'agent',
      entity_id: auth.agent.id,
      payload: {
        heartbeat_at: now,
        points_awarded: points?.points_awarded ?? 0,
      },
    })

    return json({
      agent,
      points,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
