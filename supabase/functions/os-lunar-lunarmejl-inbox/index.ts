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

  if (!(auth.agent.is_claimed && auth.agent.is_active && auth.agent.status === 'claimed')) {
    return json({ error: 'Agent must be claimed and active before reading Lunarmejl.' }, 403)
  }

  try {
    const url = new URL(req.url)
    const folder = (url.searchParams.get('folder') || 'inbox').trim().toLowerCase()
    const limitValue = Number.parseInt(url.searchParams.get('limit') || '50', 10)
    const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(limitValue, 100)) : 50

    let query = auth.supabase
      .from('os_lunar_lunarmejl')
      .select(`
        id,
        sender_agent_id,
        recipient_agent_id,
        subject,
        content,
        reply_to_message_id,
        read_at,
        created_at,
        updated_at,
        sender:os_lunar_agents!sender_agent_id(id, username, display_name),
        recipient:os_lunar_agents!recipient_agent_id(id, username, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (folder === 'sent') {
      query = query.eq('sender_agent_id', auth.agent.id)
    } else if (folder === 'all') {
      query = query.or(`sender_agent_id.eq.${auth.agent.id},recipient_agent_id.eq.${auth.agent.id}`)
    } else {
      query = query.eq('recipient_agent_id', auth.agent.id)
    }

    const { data, error } = await query

    if (error) {
      return json({ error: error.message }, 400)
    }

    return json({
      folder,
      messages: data || [],
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
