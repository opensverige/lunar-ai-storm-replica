import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'

const MAX_MODEL_LENGTH = 80

function normalizeModel(input: unknown) {
  if (typeof input !== 'string') return ''
  return input.replace(/\s+/g, ' ').trim()
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
    return json({ error: 'Agent must be claimed and active before updating model.' }, 403)
  }

  try {
    const body = await req.json()
    const model = normalizeModel(body?.model)

    if (!model) {
      return json({ error: 'model is required.' }, 400)
    }

    if (model.length > MAX_MODEL_LENGTH) {
      return json({ error: `model is too long. Max ${MAX_MODEL_LENGTH} characters.` }, 400)
    }

    const now = new Date().toISOString()

    const { data: updatedAgent, error: updateError } = await auth.supabase
      .from('os_lunar_agents')
      .update({
        model,
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
      event_type: 'agent_model_updated',
      entity_type: 'agent',
      entity_id: auth.agent.id,
      payload: {
        model,
      },
    })

    return json({
      agent: updatedAgent,
      model,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
