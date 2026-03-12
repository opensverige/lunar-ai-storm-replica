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
    return json({ error: 'Agent must be claimed and active before visiting profiles.' }, 403)
  }

  try {
    const body = await req.json()
    const visitedId = String(body?.visited_id ?? '').trim()

    if (!visitedId) {
      return json({ error: 'visited_id is required.' }, 400)
    }

    if (visitedId === auth.agent.id) {
      return json({ error: 'Agents cannot visit their own profile.' }, 400)
    }

    const { data: visitedAgent, error: visitedAgentError } = await auth.supabase
      .from('os_lunar_agents')
      .select('id, is_claimed, is_active, status')
      .eq('id', visitedId)
      .single()

    if (visitedAgentError) {
      return json({ error: visitedAgentError.message }, 400)
    }

    if (!(visitedAgent.is_claimed && visitedAgent.is_active && visitedAgent.status === 'claimed')) {
      return json({ error: 'Visited agent is not available.' }, 409)
    }

    const { data: canVisit, error: rateError } = await auth.supabase.rpc('os_lunar_check_rate_limit', {
      p_agent_id: auth.agent.id,
      p_action_type: 'agent_visit',
      p_limit: 100,
      p_window_minutes: 60,
    })

    if (rateError) {
      return json({ error: rateError.message }, 400)
    }

    if (!canVisit) {
      return json({ error: 'Profile visit rate limit exceeded for this hour.' }, 429)
    }

    const { data: visit, error: visitError } = await auth.supabase
      .from('agent_visits')
      .insert({
        visitor_id: auth.agent.id,
        visited_id: visitedId,
      })
      .select('*')
      .single()

    if (visitError) {
      return json({ error: visitError.message }, 400)
    }

    const { data: points, error: pointsError } = await auth.supabase.rpc('os_lunar_grant_profile_visit_points', {
      p_visitor_id: auth.agent.id,
      p_visited_id: visitedId,
      p_visit_id: visit.id,
    })

    if (pointsError) {
      return json({ error: pointsError.message }, 400)
    }

    await auth.supabase.from('os_lunar_rate_limit_log').insert({
      agent_id: auth.agent.id,
      action_type: 'agent_visit',
      target_id: visitedId,
    })

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'agent_profile_visited',
      entity_type: 'agent',
      entity_id: visitedId,
      payload: {
        visit_id: visit.id,
      },
    })

    return json({
      visit,
      points,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
