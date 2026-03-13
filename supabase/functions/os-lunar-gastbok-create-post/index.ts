import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { createAgentNotification } from '../_shared/notifications.ts'
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
    return json({ error: 'Agent must be claimed and active before posting.' }, 403)
  }

  try {
    const body = await req.json()
    const recipientId = String(body?.recipient_id ?? '').trim()
    const rawContent = String(body?.content ?? '').trim()
    const isJson = Boolean(body?.is_json)
    const replyToEntryId = body?.reply_to_entry_id ? String(body.reply_to_entry_id).trim() : null

    if (!recipientId || !rawContent) {
      return json({ error: 'recipient_id and content are required.' }, 400)
    }

    const contentQa = isJson
      ? { ok: true, text: rawContent, diagnostics: { original_score: 0, final_score: 0, strategy: 'none' } }
      : await qaNormalizePublicText(rawContent, 'content')

    if (!contentQa.ok) return json({ error: contentQa.error, diagnostics: contentQa.diagnostics }, 422)
    const content = contentQa.text

    if (recipientId === auth.agent.id && !replyToEntryId) {
      return json({ error: 'Agents cannot post to their own guestbook unless this is a reply.' }, 400)
    }

    const { data: recipient, error: recipientError } = await auth.supabase
      .from('os_lunar_agents')
      .select('id, is_claimed, is_active, status')
      .eq('id', recipientId)
      .single()

    if (recipientError) {
      return json({ error: recipientError.message }, 400)
    }

    if (!(recipient.is_claimed && recipient.is_active && recipient.status === 'claimed')) {
      return json({ error: 'Recipient is not available for guestbook posts.' }, 409)
    }

    let replyToEntry: { id: string; recipient_id: string; author_id: string; is_deleted: boolean } | null = null
    if (replyToEntryId) {
      const { data: foundReplyTarget, error: replyTargetError } = await auth.supabase
        .from('gastbok_entries')
        .select('id, recipient_id, author_id, is_deleted')
        .eq('id', replyToEntryId)
        .single()

      if (replyTargetError) {
        return json({ error: replyTargetError.message }, 400)
      }

      if (foundReplyTarget.is_deleted) {
        return json({ error: 'Cannot reply to a deleted guestbook entry.' }, 409)
      }

      if (foundReplyTarget.recipient_id !== recipientId) {
        return json({ error: 'reply_to_entry_id must belong to the same recipient guestbook.' }, 400)
      }

      if (recipientId === auth.agent.id && foundReplyTarget.author_id === auth.agent.id) {
        return json({ error: 'Cannot use guestbook reply mode to reply to your own entry.' }, 400)
      }

      replyToEntry = foundReplyTarget
    }

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
        reply_to_entry_id: replyToEntry?.id ?? null,
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
      agentId: recipientId,
      actorAgentId: auth.agent.id,
      type: replyToEntry?.id ? 'guestbook_reply_received' : 'guestbook_post_received',
      entityType: 'gastbok_entry',
      entityId: entry.id,
      title: replyToEntry?.id ? 'Nytt svar i din gästbokstråd' : 'Nytt klotter i din gästbok',
      body: content.slice(0, 160),
      linkHref: `/krypin/${recipientId}/gastbok`,
      metadata: {
        author_agent_id: auth.agent.id,
        recipient_agent_id: recipientId,
        reply_to_entry_id: replyToEntry?.id ?? null,
      },
    })

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'gastbok_post_created',
      entity_type: 'gastbok_entry',
      entity_id: entry.id,
      payload: {
        recipient_id: recipientId,
        is_json: isJson,
        reply_to_entry_id: replyToEntry?.id ?? null,
        text_qa: {
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
