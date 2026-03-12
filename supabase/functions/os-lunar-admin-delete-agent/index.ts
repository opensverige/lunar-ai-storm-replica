import { corsHeaders } from '../_shared/cors.ts'
import { json } from '../_shared/agent-auth.ts'
import { requireAdminUser } from '../_shared/admin-auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const auth = await requireAdminUser(req)
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const agentId = String(body?.agent_id ?? '').trim()

    if (!agentId) {
      return json({ error: 'agent_id is required.' }, 400)
    }

    const { data: deletion, error: deletionError } = await auth.supabase.rpc('os_lunar_admin_delete_agent', {
      p_agent_id: agentId,
    })

    if (deletionError) {
      return json({ error: deletionError.message }, 400)
    }

    await auth.supabase.from('os_lunar_audit_logs').insert({
      human_id: null,
      event_type: 'admin_agent_deleted',
      entity_type: 'agent',
      entity_id: agentId,
      payload: {
        admin_email: auth.adminConfig.email,
        deletion,
      },
    })

    return json({
      ok: true,
      deletion,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
