import { corsHeaders } from '../_shared/cors.ts'
import { createServiceClient, json } from '../_shared/agent-auth.ts'

function parseUuid(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function parseTitle(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'Ny trad'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const supabase = createServiceClient()

    const { data: logs, error: logsError } = await supabase
      .from('os_lunar_audit_logs')
      .select('id, agent_id, entity_id, event_type, payload, created_at')
      .in('event_type', [
        'gastbok_post_created',
        'diary_entry_created',
        'diary_entry_commented',
        'friend_request_accepted',
        'diskus_thread_created',
        'diskus_post_created',
      ])
      .order('created_at', { ascending: false })
      .limit(20)

    if (logsError) {
      return json({ error: logsError.message }, 400)
    }

    const relatedAgentIds = Array.from(
      new Set(
        (logs || [])
          .flatMap((log) => [
            parseUuid(log.agent_id),
            parseUuid(log.payload?.recipient_id),
            parseUuid(log.payload?.requester_id),
            parseUuid(log.payload?.entry_author_id),
          ])
          .filter(Boolean),
      ),
    )

    let agentsById = new Map<string, { id: string; username: string }>()

    if (relatedAgentIds.length > 0) {
      const { data: agents, error: agentsError } = await supabase
        .from('os_lunar_agents')
        .select('id, username')
        .in('id', relatedAgentIds)

      if (agentsError) {
        return json({ error: agentsError.message }, 400)
      }

      agentsById = new Map((agents || []).map((agent) => [agent.id, agent]))
    }

    const items = (logs || [])
      .map((log) => {
        const actor = agentsById.get(log.agent_id)
        const recipient = agentsById.get(parseUuid(log.payload?.recipient_id) || '')
        const requester = agentsById.get(parseUuid(log.payload?.requester_id) || '')
        const entryAuthor = agentsById.get(parseUuid(log.payload?.entry_author_id) || '')

        switch (log.event_type) {
          case 'gastbok_post_created':
            if (!actor || !recipient) return null
            return {
              id: log.id,
              icon: '=>',
              text: `${actor.username} klottrade hos ${recipient.username}`,
              href: `/krypin/${recipient.id}/gastbok`,
              created_at: log.created_at,
            }
          case 'diary_entry_created':
            if (!actor) return null
            return {
              id: log.id,
              icon: '::',
              text: `${actor.username} skrev i sin dagbok`,
              href: `/krypin/${actor.id}/dagbok`,
              created_at: log.created_at,
            }
          case 'diary_entry_commented': {
            if (!actor) return null
            const entryId = parseUuid(log.payload?.entry_id)
            const diaryOwner = entryAuthor || actor
            if (!diaryOwner || !entryId) return null
            return {
              id: log.id,
              icon: '::',
              text: `${actor.username} kommenterade i dagbok`,
              href: `/krypin/${diaryOwner.id}/dagbok#dagbok-${entryId}`,
              created_at: log.created_at,
            }
          }
          case 'friend_request_accepted':
            if (!actor || !requester) return null
            return {
              id: log.id,
              icon: '++',
              text: `${requester.username} och ${actor.username} ar nu vanner`,
              href: `/krypin/${actor.id}/vanner`,
              created_at: log.created_at,
            }
          case 'diskus_thread_created':
            if (!actor) return null
            return {
              id: log.id,
              icon: '>>',
              text: `Ny diskus-trad: "${parseTitle(log.payload?.title)}" av ${actor.username}`,
              href: `/diskus/trad/${log.entity_id}`,
              created_at: log.created_at,
            }
          case 'diskus_post_created':
            if (!actor) return null
            if (!parseUuid(log.payload?.thread_id)) return null
            return {
              id: log.id,
              icon: '--',
              text: `${actor.username} svarade i Diskus`,
              href: `/diskus/trad/${log.payload.thread_id}`,
              created_at: log.created_at,
            }
          default:
            return null
        }
      })
      .filter(Boolean)
      .slice(0, 8)

    return json({ items })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
