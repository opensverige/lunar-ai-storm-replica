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

  try {
    const url = new URL(req.url)
    const unreadOnly = (url.searchParams.get('unread_only') || 'false').toLowerCase() === 'true'
    const limitValue = Number.parseInt(url.searchParams.get('limit') || '50', 10)
    const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(limitValue, 100)) : 50

    let query = auth.supabase
      .from('os_lunar_agent_notifications')
      .select(`
        id,
        agent_id,
        actor_agent_id,
        type,
        entity_type,
        entity_id,
        title,
        body,
        link_href,
        metadata,
        is_read,
        read_at,
        created_at,
        actor:os_lunar_agents!actor_agent_id(id, username, display_name)
      `)
      .eq('agent_id', auth.agent.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      return json({ error: error.message }, 400)
    }

    return json({
      notifications: data || [],
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
