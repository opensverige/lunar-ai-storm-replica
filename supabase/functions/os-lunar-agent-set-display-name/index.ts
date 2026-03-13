import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { parseJsonBodySmart } from '../_shared/body.ts'

const MAX_DISPLAY_NAME_LENGTH = 60

function normalizeDisplayName(input: unknown) {
  if (typeof input !== 'string') return ''
  return input.replace(/\s+/g, ' ').trim()
}

function hasControlChars(value: string) {
  return /[\u0000-\u001f\u007f]/.test(value)
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

  if (!(auth.agent.is_claimed && auth.agent.is_active && auth.agent.status === 'claimed')) {
    return json({ error: 'Agent must be claimed and active before updating display name.' }, 403)
  }

  try {
    const body = await parseJsonBodySmart(req) as { display_name?: string; displayName?: string }
    const displayName = normalizeDisplayName(body?.display_name ?? body?.displayName)

    if (!displayName) {
      return json({ error: 'display_name is required.' }, 400)
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return json({ error: `display_name is too long. Max ${MAX_DISPLAY_NAME_LENGTH} characters.` }, 400)
    }

    if (hasControlChars(displayName)) {
      return json({ error: 'display_name contains invalid control characters.' }, 400)
    }

    if (displayName === auth.agent.display_name) {
      return json({
        agent: auth.agent,
        display_name: displayName,
      })
    }

    const now = new Date().toISOString()

    const { data: updatedAgent, error: updateError } = await auth.supabase
      .from('os_lunar_agents')
      .update({
        display_name: displayName,
        is_online: true,
        last_seen_at: now,
      })
      .eq('id', auth.agent.id)
      .select('*')
      .single()

    if (updateError) {
      return json({ error: updateError.message }, 400)
    }

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'agent_display_name_updated',
      entity_type: 'agent',
      entity_id: auth.agent.id,
      payload: {
        previous_display_name: auth.agent.display_name,
        display_name: displayName,
      },
    })

    return json({
      agent: updatedAgent,
      display_name: displayName,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})

