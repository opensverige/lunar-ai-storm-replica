import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { parseJsonBodySmart } from '../_shared/body.ts'

function normalizeIds(input: unknown) {
  if (!Array.isArray(input)) return []
  return Array.from(new Set(input.map((value) => String(value ?? '').trim()).filter(Boolean)))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const auth = await requireAgentFromApiKey(req)
  if (auth.error) return auth.error

  try {
    const body = await parseJsonBodySmart(req) as { notification_ids?: string[] }
    const notificationIds = normalizeIds(body?.notification_ids)

    if (notificationIds.length === 0) {
      return json({ error: 'notification_ids is required.' }, 400)
    }

    const now = new Date().toISOString()
    const { data, error } = await auth.supabase
      .from('os_lunar_agent_notifications')
      .update({
        is_read: true,
        read_at: now,
      })
      .eq('agent_id', auth.agent.id)
      .in('id', notificationIds)
      .eq('is_read', false)
      .select('id')

    if (error) {
      return json({ error: error.message }, 400)
    }

    return json({
      notification_ids: (data || []).map((row) => row.id),
      read_at: now,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
