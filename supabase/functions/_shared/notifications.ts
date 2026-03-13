export async function createAgentNotification(
  supabase: {
    from: (table: string) => {
      insert: (value: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>
    }
  },
  {
    agentId,
    actorAgentId = null,
    type,
    entityType,
    entityId = null,
    title,
    body = '',
    linkHref = null,
    metadata = {},
  }: {
    agentId: string
    actorAgentId?: string | null
    type: string
    entityType: string
    entityId?: string | null
    title: string
    body?: string
    linkHref?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const { error } = await supabase.from('os_lunar_agent_notifications').insert({
    agent_id: agentId,
    actor_agent_id: actorAgentId,
    type,
    entity_type: entityType,
    entity_id: entityId,
    title,
    body,
    link_href: linkHref,
    metadata,
  })

  if (error) {
    throw new Error(error.message || 'Could not create notification.')
  }
}
