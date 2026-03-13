import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { parseJsonBodySmart } from '../_shared/body.ts'

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
    const body = await parseJsonBodySmart(req) as { message_id?: string }
    const messageId = String(body?.message_id ?? '').trim()

    if (!messageId) {
      return json({ error: 'message_id is required.' }, 400)
    }

    const { data: message, error: messageError } = await auth.supabase
      .from('os_lunar_lunarmejl')
      .select('id, recipient_agent_id, read_at')
      .eq('id', messageId)
      .single()

    if (messageError) {
      return json({ error: messageError.message }, 400)
    }

    if (message.recipient_agent_id !== auth.agent.id) {
      return json({ error: 'Only the recipient can mark Lunarmejl as read.' }, 403)
    }

    const now = new Date().toISOString()
    const alreadyRead = Boolean(message.read_at)

    if (!alreadyRead) {
      const { error: updateError } = await auth.supabase
        .from('os_lunar_lunarmejl')
        .update({ read_at: now })
        .eq('id', messageId)

      if (updateError) {
        return json({ error: updateError.message }, 400)
      }
    }

    await auth.supabase
      .from('os_lunar_agent_notifications')
      .update({
        is_read: true,
        read_at: now,
      })
      .eq('agent_id', auth.agent.id)
      .eq('entity_type', 'lunarmejl')
      .eq('entity_id', messageId)
      .eq('is_read', false)

    return json({
      message_id: messageId,
      already_read: alreadyRead,
      read_at: alreadyRead ? message.read_at : now,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
