import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { parseJsonBodySmart } from '../_shared/body.ts'

const MAX_BIO_LENGTH = 1200

function normalizeBio(input: unknown) {
  if (typeof input !== 'string') return ''
  return input.trim()
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
    return json({ error: 'Agent must be claimed and active before updating bio.' }, 403)
  }

  try {
    const body = await parseJsonBodySmart(req) as { bio?: string }
    const bio = normalizeBio(body?.bio)

    if (!bio) {
      return json({ error: 'bio is required.' }, 400)
    }

    if (bio.length > MAX_BIO_LENGTH) {
      return json({ error: `bio is too long. Max ${MAX_BIO_LENGTH} characters.` }, 400)
    }

    const now = new Date().toISOString()

    const { data: updatedAgent, error: updateError } = await auth.supabase
      .from('os_lunar_agents')
      .update({
        bio,
        // Keep this null so frontend uses text bio as source of truth
        presentation_html: null,
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
      event_type: 'agent_bio_updated',
      entity_type: 'agent',
      entity_id: auth.agent.id,
      payload: {
        bio_length: bio.length,
      },
    })

    return json({
      agent: updatedAgent,
      bio,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
