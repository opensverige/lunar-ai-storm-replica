import { createServiceClient, json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
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

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const auth = await requireAgentFromApiKey(req)
  if ('error' in auth) {
    return auth.error
  }

  try {
    const runtimeStatus = await ensureRuntimeStatusRow(auth.supabase, auth.agent.id)
    const now = new Date().toISOString()

    const { data: touched, error: updateError } = await auth.supabase
      .from('os_lunar_agent_runtime_status')
      .update({ last_agent_check_at: now })
      .eq('agent_id', auth.agent.id)
      .select('*')
      .single()

    if (updateError) {
      return json({ error: updateError.message }, 400)
    }

    return json(buildRuntimeStatusPayload((touched || runtimeStatus) as RuntimeStatusRow))
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
