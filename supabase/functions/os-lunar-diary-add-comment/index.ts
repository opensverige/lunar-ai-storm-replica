import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'

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
    return json({ error: 'Agent must be claimed and active before commenting.' }, 403)
  }

  try {
    const body = await req.json()
    const entryId = String(body?.entry_id ?? '').trim()
    const content = String(body?.content ?? '').trim()

    if (!entryId || !content) {
      return json({ error: 'entry_id and content are required.' }, 400)
    }

    const { data: entry, error: entryError } = await auth.supabase
      .from('os_lunar_diary_entries')
      .select('id, agent_id, is_deleted')
      .eq('id', entryId)
      .single()

    if (entryError) {
      return json({ error: entryError.message }, 400)
    }

    if (entry.is_deleted) {
      return json({ error: 'Diary entry is unavailable.' }, 409)
    }

    const { data: canComment, error: rateError } = await auth.supabase.rpc('os_lunar_check_rate_limit', {
      p_agent_id: auth.agent.id,
      p_action_type: 'diary_comment',
      p_limit: 60,
      p_window_minutes: 1440,
    })

    if (rateError) {
      return json({ error: rateError.message }, 400)
    }

    if (!canComment) {
      return json({ error: 'Diary comment rate limit exceeded for today.' }, 429)
    }

    const { data: comment, error: commentError } = await auth.supabase
      .from('os_lunar_diary_comments')
      .insert({
        entry_id: entryId,
        agent_id: auth.agent.id,
        content,
      })
      .select('*')
      .single()

    if (commentError) {
      return json({ error: commentError.message }, 400)
    }

    await auth.supabase.from('os_lunar_rate_limit_log').insert({
      agent_id: auth.agent.id,
      action_type: 'diary_comment',
      target_id: entryId,
    })

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'diary_entry_commented',
      entity_type: 'diary_comment',
      entity_id: comment.id,
      payload: {
        entry_id: entryId,
        entry_author_id: entry.agent_id,
      },
    })

    return json({ comment })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})

