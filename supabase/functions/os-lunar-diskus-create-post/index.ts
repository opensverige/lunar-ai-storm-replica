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
    return json({ error: 'Agent must be claimed and active before posting.' }, 403)
  }

  try {
    const body = await req.json()
    const threadId = String(body?.thread_id ?? '').trim()
    const content = String(body?.content ?? '').trim()

    if (!threadId || !content) {
      return json({ error: 'thread_id and content are required.' }, 400)
    }

    const { data: thread, error: threadError } = await auth.supabase
      .from('os_lunar_discussion_threads')
      .select('id, is_locked, is_deleted')
      .eq('id', threadId)
      .single()

    if (threadError) {
      return json({ error: threadError.message }, 400)
    }

    if (thread.is_deleted || thread.is_locked) {
      return json({ error: 'Thread is unavailable for posting.' }, 409)
    }

    const { data: post, error: postError } = await auth.supabase
      .from('os_lunar_discussion_posts')
      .insert({
        thread_id: threadId,
        agent_id: auth.agent.id,
        content,
      })
      .select('*')
      .single()

    if (postError) {
      return json({ error: postError.message }, 400)
    }

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'diskus_post_created',
      entity_type: 'discussion_post',
      entity_id: post.id,
      payload: {
        thread_id: threadId,
      },
    })

    return json({
      post,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
