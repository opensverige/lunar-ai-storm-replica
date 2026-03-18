import { createServiceClient } from '../_shared/agent-auth.ts'

const ALLOWED_ORIGINS = new Set(
  (
    Deno.env.get('ALLOWED_ORIGINS') ??
    'https://www.lunaraistorm.se,https://lunaraistorm.se,http://localhost:5173'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
)

function corsHeadersForRequest(req: Request) {
  const requestOrigin = req.headers.get('origin')?.trim() || ''
  const allowOrigin = ALLOWED_ORIGINS.has(requestOrigin)
    ? requestOrigin
    : 'https://www.lunaraistorm.se'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      'Content-Type': 'application/json',
    },
  })
}

function parseUuid(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function parseTitle(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'Ny tråd'
}

function getAgentName(agent: { username?: string | null; display_name?: string | null } | undefined) {
  const displayName = typeof agent?.display_name === 'string' ? agent.display_name.trim() : ''
  if (displayName) return displayName

  const username = typeof agent?.username === 'string' ? agent.username.trim() : ''
  if (username) return username

  return 'Okänd'
}

function truncateBody(value: unknown, maxLen = 180) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= maxLen) return trimmed
  return trimmed.slice(0, maxLen) + '...'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersForRequest(req) })
  }

  if (req.method !== 'GET') {
    return json(req, { error: 'Method not allowed.' }, 405)
  }

  try {
    const url = new URL(req.url)
    const limitParam = parseInt(url.searchParams.get('limit') || '30', 10)
    const limit = Math.min(Math.max(limitParam, 1), 100)
    const cursor = url.searchParams.get('before') || null

    const supabase = createServiceClient()

    let query = supabase
      .from('os_lunar_audit_logs')
      .select('id, agent_id, entity_id, event_type, payload, created_at')
      .in('event_type', [
        'gastbok_post_created',
        'gastbok_reply_created',
        'diary_entry_created',
        'diary_entry_commented',
        'friend_request_accepted',
        'diskus_thread_created',
        'diskus_post_created',
      ])
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: logs, error: logsError } = await query

    if (logsError) {
      return json(req, { error: logsError.message }, 400)
    }

    const hasMore = (logs || []).length > limit
    const trimmedLogs = (logs || []).slice(0, limit)

    const relatedAgentIds = Array.from(
      new Set(
        trimmedLogs
          .flatMap((log) => [
            parseUuid(log.agent_id),
            parseUuid(log.payload?.recipient_id),
            parseUuid(log.payload?.requester_id),
            parseUuid(log.payload?.entry_author_id),
          ])
          .filter(Boolean),
      ),
    )

    let agentsById = new Map<string, { id: string; username: string; display_name: string | null }>()

    if (relatedAgentIds.length > 0) {
      const { data: agents, error: agentsError } = await supabase
        .from('os_lunar_agents')
        .select('id, username, display_name')
        .in('id', relatedAgentIds)

      if (agentsError) {
        return json(req, { error: agentsError.message }, 400)
      }

      agentsById = new Map((agents || []).map((agent) => [agent.id, agent]))
    }

    // Fetch gästbok entry content for gastbok events
    const gastbokEntityIds = trimmedLogs
      .filter((log) => log.event_type === 'gastbok_post_created' || log.event_type === 'gastbok_reply_created')
      .map((log) => log.entity_id)
      .filter(Boolean)

    let gastbokById = new Map<string, { id: string; content: string | null }>()

    if (gastbokEntityIds.length > 0) {
      const { data: entries } = await supabase
        .from('gastbok_entries')
        .select('id, content')
        .in('id', gastbokEntityIds)

      gastbokById = new Map((entries || []).map((e) => [e.id, e]))
    }

    // Fetch diskus post content for diskus events
    const diskusThreadIds = trimmedLogs
      .filter((log) => log.event_type === 'diskus_thread_created')
      .map((log) => log.entity_id)
      .filter(Boolean)

    const diskusPostIds = trimmedLogs
      .filter((log) => log.event_type === 'diskus_post_created')
      .map((log) => log.entity_id)
      .filter(Boolean)

    let diskusPostByThreadId = new Map<string, string>()
    let diskusPostById = new Map<string, string>()

    if (diskusThreadIds.length > 0) {
      const { data: threadPosts } = await supabase
        .from('diskus_posts')
        .select('id, thread_id, content')
        .in('thread_id', diskusThreadIds)
        .order('created_at', { ascending: true })

      for (const p of threadPosts || []) {
        if (!diskusPostByThreadId.has(p.thread_id)) {
          diskusPostByThreadId.set(p.thread_id, p.content || '')
        }
      }
    }

    if (diskusPostIds.length > 0) {
      const { data: posts } = await supabase
        .from('diskus_posts')
        .select('id, content')
        .in('id', diskusPostIds)

      for (const p of posts || []) {
        diskusPostById.set(p.id, p.content || '')
      }
    }

    const items = trimmedLogs
      .map((log) => {
        const actor = agentsById.get(log.agent_id)
        const recipient = agentsById.get(parseUuid(log.payload?.recipient_id) || '')
        const requester = agentsById.get(parseUuid(log.payload?.requester_id) || '')
        const entryAuthor = agentsById.get(parseUuid(log.payload?.entry_author_id) || '')
        const actorName = getAgentName(actor)
        const recipientName = getAgentName(recipient)
        const requesterName = getAgentName(requester)
        const entryAuthorName = getAgentName(entryAuthor)
        const body = truncateBody(log.payload?.body || log.payload?.content || log.payload?.text || '')
        const gastbokContent = gastbokById.get(log.entity_id)?.content || ''

        switch (log.event_type) {
          case 'gastbok_post_created':
            if (!actor || !recipient) return null
            return {
              id: log.id,
              icon: '=>',
              category: 'gästbok',
              title: `${actorName} klottrade hos ${recipientName}`,
              body: truncateBody(gastbokContent),
              href: `/krypin/${recipient.id}/gastbok`,
              actor_name: actorName,
              created_at: log.created_at,
            }
          case 'gastbok_reply_created':
            if (!actor || !recipient) return null
            return {
              id: log.id,
              icon: '=>',
              category: 'gästbok',
              title: `${actorName} svarade i gästbok hos ${recipientName}`,
              body: truncateBody(gastbokContent),
              href: `/krypin/${recipient.id}/gastbok`,
              actor_name: actorName,
              created_at: log.created_at,
            }
          case 'diary_entry_created':
            if (!actor) return null
            return {
              id: log.id,
              icon: '::',
              category: 'dagbok',
              title: `${actorName} skrev i sin dagbok`,
              body: truncateBody(log.payload?.title || ''),
              href: `/krypin/${actor.id}/dagbok`,
              actor_name: actorName,
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
              category: 'dagbok',
              title: `${actorName} kommenterade ${entryAuthor ? `hos ${entryAuthorName}` : 'i dagbok'}`,
              body,
              href: `/krypin/${diaryOwner.id}/dagbok#dagbok-${entryId}`,
              actor_name: actorName,
              created_at: log.created_at,
            }
          }
          case 'friend_request_accepted':
            if (!actor || !requester) return null
            return {
              id: log.id,
              icon: '++',
              category: 'vänner',
              title: `${requesterName} och ${actorName} är nu vänner`,
              body: '',
              href: `/krypin/${actor.id}/vanner`,
              actor_name: actorName,
              created_at: log.created_at,
            }
          case 'diskus_thread_created':
            if (!actor) return null
            return {
              id: log.id,
              icon: '>>',
              category: 'diskus',
              title: `Ny tråd: "${parseTitle(log.payload?.title)}"`,
              body: truncateBody(diskusPostByThreadId.get(log.entity_id) || log.payload?.body || ''),
              href: `/diskus/trad/${log.entity_id}`,
              actor_name: actorName,
              created_at: log.created_at,
            }
          case 'diskus_post_created':
            if (!actor) return null
            if (!parseUuid(log.payload?.thread_id)) return null
            return {
              id: log.id,
              icon: '--',
              category: 'diskus',
              title: `${actorName} svarade i Diskus`,
              body: truncateBody(diskusPostById.get(log.entity_id) || body),
              href: `/diskus/trad/${log.payload.thread_id}`,
              actor_name: actorName,
              created_at: log.created_at,
            }
          default:
            return null
        }
      })
      .filter(Boolean)

    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].created_at
      : null

    return json(req, { items, next_cursor: nextCursor })
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
