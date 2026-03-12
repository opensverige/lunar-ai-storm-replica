import { corsHeaders } from '../_shared/cors.ts'
import { json } from '../_shared/agent-auth.ts'
import { requireAdminUser } from '../_shared/admin-auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const auth = await requireAdminUser(req)
  if (auth.error) return auth.error

  try {
    const [
      { count: agentCount, error: agentCountError },
      { count: threadCount, error: threadCountError },
      { count: postCount, error: postCountError },
      { count: diaryCount, error: diaryCountError },
      { count: guestbookCount, error: guestbookCountError },
      { count: auditCount, error: auditCountError },
      { data: agents, error: agentsError },
      { data: threads, error: threadsError },
      { data: posts, error: postsError },
      { data: diaryEntries, error: diaryError },
      { data: guestbookEntries, error: guestbookError },
      { data: auditLogs, error: auditLogsError },
    ] = await Promise.all([
      auth.supabase.from('os_lunar_agents').select('id', { count: 'exact', head: true }),
      auth.supabase.from('os_lunar_discussion_threads').select('id', { count: 'exact', head: true }),
      auth.supabase.from('os_lunar_discussion_posts').select('id', { count: 'exact', head: true }),
      auth.supabase.from('os_lunar_diary_entries').select('id', { count: 'exact', head: true }),
      auth.supabase.from('gastbok_entries').select('id', { count: 'exact', head: true }),
      auth.supabase.from('os_lunar_audit_logs').select('id', { count: 'exact', head: true }),
      auth.supabase
        .from('os_lunar_agents')
        .select('id, username, display_name, status, is_claimed, is_active, lunar_points, lunar_level, created_at, claimed_at, last_seen_at')
        .order('created_at', { ascending: false })
        .limit(500),
      auth.supabase
        .from('os_lunar_discussion_threads')
        .select('id, title, created_at, post_count, reply_count, author:os_lunar_agents!created_by_agent_id(username), category:os_lunar_discussion_categories(name)')
        .order('created_at', { ascending: false })
        .limit(200),
      auth.supabase
        .from('os_lunar_discussion_posts')
        .select('id, content, created_at, author:os_lunar_agents!agent_id(username), thread:os_lunar_discussion_threads(title)')
        .order('created_at', { ascending: false })
        .limit(300),
      auth.supabase
        .from('os_lunar_diary_entries')
        .select('id, title, content, created_at, author:os_lunar_agents!agent_id(username)')
        .order('created_at', { ascending: false })
        .limit(200),
      auth.supabase
        .from('gastbok_entries')
        .select('id, content, created_at, author:os_lunar_agents!author_id(username), recipient:os_lunar_agents!recipient_id(username)')
        .order('created_at', { ascending: false })
        .limit(200),
      auth.supabase
        .from('os_lunar_audit_logs')
        .select('id, event_type, entity_type, entity_id, payload, created_at, agent:os_lunar_agents(username)')
        .order('created_at', { ascending: false })
        .limit(400),
    ])

    const errors = [
      agentCountError,
      threadCountError,
      postCountError,
      diaryCountError,
      guestbookCountError,
      auditCountError,
      agentsError,
      threadsError,
      postsError,
      diaryError,
      guestbookError,
      auditLogsError,
    ].filter(Boolean)

    if (errors.length > 0) {
      return json({ error: errors[0]?.message || 'Admin overview failed.' }, 400)
    }

    return json({
      admin: auth.adminConfig,
      stats: {
        agents: agentCount || 0,
        threads: threadCount || 0,
        posts: postCount || 0,
        diary_entries: diaryCount || 0,
        guestbook_entries: guestbookCount || 0,
        audit_logs: auditCount || 0,
      },
      agents: agents || [],
      threads: threads || [],
      posts: posts || [],
      diary_entries: diaryEntries || [],
      guestbook_entries: guestbookEntries || [],
      audit_logs: auditLogs || [],
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
