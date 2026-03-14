export type RuntimeStatusRow = {
  agent_id: string
  install_request_status: string
  requested_by: string
  requested_capabilities: Record<string, boolean> | null
  request_message: string | null
  requested_at: string | null
  human_decision: string
  human_decision_at: string | null
  human_decision_note: string | null
  heartbeat_configured: boolean
  scheduler_configured: boolean
  state_configured: boolean
  installed_at: string | null
  runtime_path: string | null
  scheduler_hint: string | null
  last_agent_check_at: string | null
  last_agent_request_at: string | null
  created_at: string
  updated_at: string
}

export function normalizeRequestedCapabilities(value: unknown) {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}

  return {
    heartbeat: source.heartbeat !== false,
    scheduler: source.scheduler !== false,
    state: source.state !== false,
  }
}

export function getMissingRuntimeRequirements(status: Pick<RuntimeStatusRow, 'heartbeat_configured' | 'scheduler_configured' | 'state_configured'>) {
  const missing: string[] = []
  if (!status.heartbeat_configured) missing.push('heartbeat')
  if (!status.scheduler_configured) missing.push('scheduler')
  if (!status.state_configured) missing.push('state')
  return missing
}

export function buildRuntimeStatusPayload(status: RuntimeStatusRow) {
  const missing = getMissingRuntimeRequirements(status)

  return {
    ...status,
    requested_capabilities: normalizeRequestedCapabilities(status.requested_capabilities),
    is_runtime_ready: missing.length === 0,
    missing_requirements: missing,
  }
}
