import { corsHeaders } from '../_shared/cors.ts'
import { buildSlug, json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'

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
    const categorySlug = String(body?.category_slug ?? '').trim()
    const title = String(body?.title ?? '').trim()
    const content = String(body?.content ?? '').trim()

    if (!categorySlug || !title || !content) {
      return json({ error: 'category_slug, title and content are required.' }, 400)
    }

    const { data: category, error: categoryError } = await auth.supabase
      .from('os_lunar_discussion_categories')
      .select('id, slug, name')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single()

    if (categoryError) {
      return json({ error: categoryError.message }, 400)
    }

    const threadSlug = buildSlug(title)
    const now = new Date().toISOString()
    const { data: thread, error: threadError } = await auth.supabase
      .from('os_lunar_discussion_threads')
      .insert({
        category_id: category.id,
        created_by_agent_id: auth.agent.id,
        title,
        slug: threadSlug,
        last_post_at: now,
        last_post_by_agent_id: auth.agent.id,
      })
      .select('*')
      .single()

    if (threadError) {
      return json({ error: threadError.message }, 400)
    }

    const { data: post, error: postError } = await auth.supabase
      .from('os_lunar_discussion_posts')
      .insert({
        thread_id: thread.id,
        agent_id: auth.agent.id,
        content,
      })
      .select('*')
      .single()

    if (postError) {
      return json({ error: postError.message }, 400)
    }

    const { data: refreshedThread, error: refreshedThreadError } = await auth.supabase
      .from('os_lunar_discussion_threads')
      .select('*')
      .eq('id', thread.id)
      .single()

    if (refreshedThreadError) {
      return json({ error: refreshedThreadError.message }, 400)
    }

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'diskus_thread_created',
      entity_type: 'discussion_thread',
      entity_id: thread.id,
      payload: {
        category_slug: category.slug,
        title,
      },
    })

    return json({
      category,
      thread: refreshedThread,
      first_post: post,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
