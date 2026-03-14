import { parseJsonBodySmart } from '../_shared/body.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createServiceClient, json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { buildRuntimeStatusPayload, normalizeRequestedCapabilities, type RuntimeStatusRow } from '../_shared/runtime-status.ts'

async function ensureRuntimeStatusRow(supabase: ReturnType<typeof createServiceClient>, agentId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('os_lunar_agent_runtime_status')
    .select('*')
    .eq('agent_id', agentId)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existing) {
    return existing as RuntimeStatusRow
  }

  const { data: inserted, error: insertError } = await supabase
    .from('os_lunar_agent_runtime_status')
    .insert({
      agent_id: agentId,
      requested_capabilities: normalizeRequestedCapabilities(null),
    })
    .select('*')
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  return inserted as RuntimeStatusRow
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const auth = await requireAgentFromApiKey(req)
  if ('error' in auth) {
    return auth.error
  }

  if (!auth.agent.is_claimed || !auth.agent.is_active || auth.agent.status !== 'claimed') {
    return json({ error: 'Agent must be claimed and active before requesting runtime setup.' }, 409)
  }

  if (!auth.agent.owner_human_id) {
    return json({ error: 'Agent does not have an owning human yet.' }, 409)
  }

  try {
    const body = await parseJsonBodySmart(req) as {
      message?: string
      requested_capabilities?: Record<string, boolean>
    }

    const requestMessage = String(body?.message ?? '').trim()
    const requestedCapabilities = normalizeRequestedCapabilities(body?.requested_capabilities)
    await ensureRuntimeStatusRow(auth.supabase, auth.agent.id)

    const now = new Date().toISOString()

    const { data: updated, error: updateError } = await auth.supabase
      .from('os_lunar_agent_runtime_status')
      .upsert({
        agent_id: auth.agent.id,
        install_request_status: 'pending_human_approval',
        requested_by: 'agent',
        requested_capabilities: requestedCapabilities,
        request_message: requestMessage || 'Jag saknar heartbeat, scheduler och state. Ska vi sätta upp det här?',
        requested_at: now,
        human_decision: 'pending',
        human_decision_at: null,
        human_decision_note: null,
        last_agent_request_at: now,
      }, { onConflict: 'agent_id' })
      .select('*')
      .single()

    if (updateError) {
      return json({ error: updateError.message }, 400)
    }

    await auth.supabase
      .from('os_lunar_audit_logs')
      .insert({
        agent_id: auth.agent.id,
        human_id: auth.agent.owner_human_id,
        event_type: 'agent_runtime_setup_requested',
        entity_type: 'agent_runtime_status',
        entity_id: auth.agent.id,
        payload: {
          requested_capabilities: requestedCapabilities,
          request_message: requestMessage || null,
        },
      })

    return json(buildRuntimeStatusPayload(updated as RuntimeStatusRow))
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
