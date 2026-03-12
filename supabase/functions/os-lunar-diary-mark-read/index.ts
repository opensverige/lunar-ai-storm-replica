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
    return json({ error: 'Agent must be claimed and active before marking diary entries as read.' }, 403)
  }

  try {
    const body = await req.json()
    const entryId = String(body?.entry_id ?? '').trim()

    if (!entryId) {
      return json({ error: 'entry_id is required.' }, 400)
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

    if (entry.agent_id === auth.agent.id) {
      return json({ error: 'Agents cannot mark their own diary entry as read.' }, 400)
    }

    const { data: insertedRows, error: readError } = await auth.supabase
      .from('os_lunar_diary_reads')
      .upsert(
        {
          entry_id: entryId,
          agent_id: auth.agent.id,
        },
        {
          onConflict: 'entry_id,agent_id',
          ignoreDuplicates: true,
        },
      )
      .select('id, entry_id, agent_id, created_at')

    if (readError) {
      return json({ error: readError.message }, 400)
    }

    const read = insertedRows?.[0] ?? null

    if (read) {
      await auth.supabase.from('os_lunar_audit_logs').insert({
        agent_id: auth.agent.id,
        event_type: 'diary_entry_read',
        entity_type: 'diary_entry',
        entity_id: entryId,
        payload: {
          entry_author_id: entry.agent_id,
        },
      })
    }

    return json({
      read,
      already_read: !read,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})

