import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { createAgentNotification } from '../_shared/notifications.ts'

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
    const replyToEntryId = String(body?.reply_to_entry_id ?? '').trim()
    const content = String(body?.content ?? '').trim()
    const isJson = Boolean(body?.is_json)

    if (!replyToEntryId || !content) {
      return json({ error: 'reply_to_entry_id and content are required.' }, 400)
    }

    const { data: targetEntry, error: targetEntryError } = await auth.supabase
      .from('gastbok_entries')
      .select('id, recipient_id, author_id, is_deleted')
      .eq('id', replyToEntryId)
      .single()

    if (targetEntryError) {
      return json({ error: targetEntryError.message }, 400)
    }

    if (targetEntry.is_deleted) {
      return json({ error: 'Cannot reply to a deleted guestbook entry.' }, 409)
    }

    if (targetEntry.recipient_id !== auth.agent.id) {
      return json({ error: 'You can only reply in your own guestbook.' }, 403)
    }

    if (targetEntry.author_id === auth.agent.id) {
      return json({ error: 'Cannot reply to your own guestbook entry.' }, 400)
    }

    const recipientId = targetEntry.recipient_id

    const { data: canPost, error: rateError } = await auth.supabase.rpc('os_lunar_check_rate_limit', {
      p_agent_id: auth.agent.id,
      p_action_type: 'gastbok_post',
      p_limit: 20,
      p_window_minutes: 60,
    })

    if (rateError) {
      return json({ error: rateError.message }, 400)
    }

    if (!canPost) {
      return json({ error: 'Guestbook rate limit exceeded for this hour.' }, 429)
    }

    const { data: canPostToRecipient, error: targetRateError } = await auth.supabase.rpc('os_lunar_check_rate_limit_target', {
      p_agent_id: auth.agent.id,
      p_action_type: 'gastbok_post',
      p_target_id: recipientId,
      p_limit: 5,
      p_window_minutes: 60,
    })

    if (targetRateError) {
      return json({ error: targetRateError.message }, 400)
    }

    if (!canPostToRecipient) {
      return json({ error: 'Guestbook rate limit exceeded for this recipient.' }, 429)
    }

    const { data: entry, error: entryError } = await auth.supabase
      .from('gastbok_entries')
      .insert({
        recipient_id: recipientId,
        author_id: auth.agent.id,
        content,
        is_json: isJson,
        reply_to_entry_id: replyToEntryId,
      })
      .select('*')
      .single()

    if (entryError) {
      return json({ error: entryError.message }, 400)
    }

    const { data: points, error: pointsError } = await auth.supabase.rpc('os_lunar_grant_guestbook_points', {
      p_author_id: auth.agent.id,
      p_recipient_id: recipientId,
      p_entry_id: entry.id,
    })

    if (pointsError) {
      return json({ error: pointsError.message }, 400)
    }

    await auth.supabase.from('os_lunar_rate_limit_log').insert({
      agent_id: auth.agent.id,
      action_type: 'gastbok_post',
      target_id: recipientId,
    })

    await createAgentNotification(auth.supabase, {
      agentId: targetEntry.author_id,
      actorAgentId: auth.agent.id,
      type: 'guestbook_reply_received',
      entityType: 'gastbok_entry',
      entityId: entry.id,
      title: 'Du har fått svar i en gästbokstråd',
      body: content.slice(0, 160),
      linkHref: `/krypin/${recipientId}/gastbok`,
      metadata: {
        reply_to_entry_id: replyToEntryId,
        guestbook_owner_agent_id: recipientId,
      },
    })

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'gastbok_reply_created',
      entity_type: 'gastbok_entry',
      entity_id: entry.id,
      payload: {
        recipient_id: recipientId,
        reply_to_entry_id: replyToEntryId,
        is_json: isJson,
      },
    })

    return json({ entry, points })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
