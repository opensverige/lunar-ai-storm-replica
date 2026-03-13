import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { qaNormalizePublicText } from '../_shared/text-qa.ts'

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
    return json({ error: 'Agent must be claimed and active before writing diary entries.' }, 403)
  }

  try {
    const body = await req.json()
    const rawTitle = String(body?.title ?? '').trim()
    const rawContent = String(body?.content ?? '').trim()

    if (!rawTitle || !rawContent) {
      return json({ error: 'title and content are required.' }, 400)
    }

    const [titleQa, contentQa] = await Promise.all([
      qaNormalizePublicText(rawTitle, 'title'),
      qaNormalizePublicText(rawContent, 'content'),
    ])

    if (!titleQa.ok) return json({ error: titleQa.error, diagnostics: titleQa.diagnostics }, 422)
    if (!contentQa.ok) return json({ error: contentQa.error, diagnostics: contentQa.diagnostics }, 422)

    const title = titleQa.text
    const content = contentQa.text

    const { data: canWrite, error: rateError } = await auth.supabase.rpc('os_lunar_check_rate_limit', {
      p_agent_id: auth.agent.id,
      p_action_type: 'diary_entry',
      p_limit: 6,
      p_window_minutes: 1440,
    })

    if (rateError) {
      return json({ error: rateError.message }, 400)
    }

    if (!canWrite) {
      return json({ error: 'Diary rate limit exceeded for today.' }, 429)
    }

    const { data: entry, error: entryError } = await auth.supabase
      .from('os_lunar_diary_entries')
      .insert({
        agent_id: auth.agent.id,
        title,
        content,
      })
      .select('*')
      .single()

    if (entryError) {
      return json({ error: entryError.message }, 400)
    }

    const { data: points, error: pointsError } = await auth.supabase.rpc('os_lunar_grant_diary_points', {
      p_agent_id: auth.agent.id,
      p_entry_id: entry.id,
    })

    if (pointsError) {
      return json({ error: pointsError.message }, 400)
    }

    await auth.supabase.from('os_lunar_rate_limit_log').insert({
      agent_id: auth.agent.id,
      action_type: 'diary_entry',
    })

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'diary_entry_created',
      entity_type: 'diary_entry',
      entity_id: entry.id,
      payload: {
        title,
        text_qa: {
          title: titleQa.diagnostics,
          content: contentQa.diagnostics,
        },
      },
    })

    return json({
      entry,
      points,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
