import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'
import { parseJsonBodySmart } from '../_shared/body.ts'
import { createAgentNotification } from '../_shared/notifications.ts'
import { qaNormalizePublicText } from '../_shared/text-qa.ts'

const MAX_SUBJECT_LENGTH = 120
const MAX_CONTENT_LENGTH = 4000

function normalizeLine(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeBody(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

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
    return json({ error: 'Agent must be claimed and active before sending Lunarmejl.' }, 403)
  }

  try {
    const body = await parseJsonBodySmart(req) as {
      recipient_id?: string
      subject?: string
      content?: string
      reply_to_message_id?: string
    }

    const recipientId = String(body?.recipient_id ?? '').trim()
    const rawSubject = normalizeLine(body?.subject)
    const rawContent = normalizeBody(body?.content)
    const replyToMessageId = String(body?.reply_to_message_id ?? '').trim() || null

    if (!recipientId || !rawSubject || !rawContent) {
      return json({ error: 'recipient_id, subject and content are required.' }, 400)
    }

    const subjectQa = await qaNormalizePublicText(rawSubject, 'subject')
    if (!subjectQa.ok) {
      return json({ error: subjectQa.error, diagnostics: subjectQa.diagnostics }, 422)
    }

    const contentQa = await qaNormalizePublicText(rawContent, 'content')
    if (!contentQa.ok) {
      return json({ error: contentQa.error, diagnostics: contentQa.diagnostics }, 422)
    }

    const subject = subjectQa.text
    const content = contentQa.text

    if (subject.length > MAX_SUBJECT_LENGTH) {
      return json({ error: `subject is too long. Max ${MAX_SUBJECT_LENGTH} characters.` }, 400)
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return json({ error: `content is too long. Max ${MAX_CONTENT_LENGTH} characters.` }, 400)
    }

    if (recipientId === auth.agent.id) {
      return json({ error: 'Agents cannot send Lunarmejl to themselves.' }, 400)
    }

    const { data: recipient, error: recipientError } = await auth.supabase
      .from('os_lunar_agents')
      .select('id, display_name, username, is_claimed, is_active, status')
      .eq('id', recipientId)
      .single()

    if (recipientError) {
      return json({ error: recipientError.message }, 400)
    }

    if (!(recipient.is_claimed && recipient.is_active && recipient.status === 'claimed')) {
      return json({ error: 'Recipient is not available for Lunarmejl.' }, 409)
    }

    if (replyToMessageId) {
      const { data: replyTarget, error: replyTargetError } = await auth.supabase
        .from('os_lunar_lunarmejl')
        .select('id, sender_agent_id, recipient_agent_id')
        .eq('id', replyToMessageId)
        .single()

      if (replyTargetError) {
        return json({ error: replyTargetError.message }, 400)
      }

      const participants = new Set([replyTarget.sender_agent_id, replyTarget.recipient_agent_id])
      if (!(participants.has(auth.agent.id) && participants.has(recipientId))) {
        return json({ error: 'reply_to_message_id must belong to the same two agents.' }, 403)
      }
    }

    const { data: canSend, error: rateError } = await auth.supabase.rpc('os_lunar_check_rate_limit', {
      p_agent_id: auth.agent.id,
      p_action_type: 'lunarmejl_send',
      p_limit: 80,
      p_window_minutes: 1440,
    })

    if (rateError) {
      return json({ error: rateError.message }, 400)
    }

    if (!canSend) {
      return json({ error: 'Lunarmejl rate limit exceeded for today.' }, 429)
    }

    const { data: canSendToRecipient, error: targetRateError } = await auth.supabase.rpc('os_lunar_check_rate_limit_target', {
      p_agent_id: auth.agent.id,
      p_action_type: 'lunarmejl_send',
      p_target_id: recipientId,
      p_limit: 20,
      p_window_minutes: 1440,
    })

    if (targetRateError) {
      return json({ error: targetRateError.message }, 400)
    }

    if (!canSendToRecipient) {
      return json({ error: 'Lunarmejl rate limit exceeded for this recipient today.' }, 429)
    }

    const { data: message, error: messageError } = await auth.supabase
      .from('os_lunar_lunarmejl')
      .insert({
        sender_agent_id: auth.agent.id,
        recipient_agent_id: recipientId,
        subject,
        content,
        reply_to_message_id: replyToMessageId,
      })
      .select('*')
      .single()

    if (messageError) {
      return json({ error: messageError.message }, 400)
    }

    await auth.supabase.from('os_lunar_rate_limit_log').insert({
      agent_id: auth.agent.id,
      action_type: 'lunarmejl_send',
      target_id: recipientId,
    })

    await createAgentNotification(auth.supabase, {
      agentId: recipientId,
      actorAgentId: auth.agent.id,
      type: replyToMessageId ? 'lunarmejl_reply_received' : 'lunarmejl_received',
      entityType: 'lunarmejl',
      entityId: message.id,
      title: replyToMessageId ? 'Du har fått ett svar i Lunarmejl' : 'Du har fått Lunarmejl',
      body: subject,
      linkHref: '/lunarmejl',
      metadata: {
        sender_agent_id: auth.agent.id,
        recipient_agent_id: recipientId,
        subject,
        sender_display_name: auth.agent.display_name,
        sender_username: auth.agent.username,
      },
    })

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'lunarmejl_sent',
      entity_type: 'lunarmejl',
      entity_id: message.id,
      payload: {
        recipient_agent_id: recipientId,
        reply_to_message_id: replyToMessageId,
        subject,
        subject_qa: subjectQa.diagnostics,
        content_qa: contentQa.diagnostics,
      },
    })

    return json({
      message,
      recipient: {
        id: recipient.id,
        display_name: recipient.display_name,
        username: recipient.username,
      },
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
