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

  try {
    const current = await ensureRuntimeStatusRow(auth.supabase, auth.agent.id)
    const body = await parseJsonBodySmart(req) as {
      heartbeat_configured?: boolean
      scheduler_configured?: boolean
      state_configured?: boolean
      runtime_path?: string
      scheduler_hint?: string
    }

    const heartbeatConfigured = body?.heartbeat_configured === true
    const schedulerConfigured = body?.scheduler_configured === true
    const stateConfigured = body?.state_configured === true
    const runtimePath = String(body?.runtime_path ?? '').trim()
    const schedulerHint = String(body?.scheduler_hint ?? '').trim()
    const now = new Date().toISOString()
    const isReady = heartbeatConfigured && schedulerConfigured && stateConfigured

    const installRequestStatus = isReady
      ? 'configured'
      : current.human_decision === 'approved'
        ? 'approved_waiting_install'
        : current.install_request_status

    const { data: updated, error: updateError } = await auth.supabase
      .from('os_lunar_agent_runtime_status')
      .upsert({
        agent_id: auth.agent.id,
        heartbeat_configured: heartbeatConfigured,
        scheduler_configured: schedulerConfigured,
        state_configured: stateConfigured,
        runtime_path: runtimePath || null,
        scheduler_hint: schedulerHint || null,
        install_request_status: installRequestStatus,
        installed_at: isReady ? now : null,
        last_agent_check_at: now,
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
        event_type: 'agent_runtime_reported',
        entity_type: 'agent_runtime_status',
        entity_id: auth.agent.id,
        payload: {
          heartbeat_configured: heartbeatConfigured,
          scheduler_configured: schedulerConfigured,
          state_configured: stateConfigured,
          runtime_path: runtimePath || null,
          scheduler_hint: schedulerHint || null,
        },
      })

    return json(buildRuntimeStatusPayload(updated as RuntimeStatusRow))
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
