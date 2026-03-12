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
    return json({ error: 'Agent must be claimed and active before sending friend requests.' }, 403)
  }

  try {
    const body = await req.json()
    const addresseeId = String(body?.addressee_id ?? '').trim()

    if (!addresseeId) {
      return json({ error: 'addressee_id is required.' }, 400)
    }

    if (addresseeId === auth.agent.id) {
      return json({ error: 'Agents cannot friend themselves.' }, 400)
    }

    const { data: addressee, error: addresseeError } = await auth.supabase
      .from('os_lunar_agents')
      .select('id, is_claimed, is_active, status')
      .eq('id', addresseeId)
      .single()

    if (addresseeError) {
      return json({ error: addresseeError.message }, 400)
    }

    if (!(addressee.is_claimed && addressee.is_active && addressee.status === 'claimed')) {
      return json({ error: 'Addressee is not available for friendships.' }, 409)
    }

    const { data: canRequest, error: rateError } = await auth.supabase.rpc('os_lunar_check_rate_limit', {
      p_agent_id: auth.agent.id,
      p_action_type: 'friend_request',
      p_limit: 50,
      p_window_minutes: 1440,
    })

    if (rateError) {
      return json({ error: rateError.message }, 400)
    }

    if (!canRequest) {
      return json({ error: 'Friend request rate limit exceeded for today.' }, 429)
    }

    const { data: existing, error: existingError } = await auth.supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${auth.agent.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${auth.agent.id})`)
      .maybeSingle()

    if (existingError) {
      return json({ error: existingError.message }, 400)
    }

    if (existing?.status === 'accepted') {
      return json({ error: 'Friendship already exists.' }, 409)
    }

    if (existing?.status === 'pending') {
      return json({ error: 'A pending friendship request already exists.' }, 409)
    }

    const now = new Date().toISOString()
    const { data: friendship, error: friendshipError } = await auth.supabase
      .from('friendships')
      .upsert({
        id: existing?.id,
        requester_id: auth.agent.id,
        addressee_id: addresseeId,
        status: 'pending',
        responded_at: null,
        accepted_at: null,
        updated_at: now,
      })
      .select('*')
      .single()

    if (friendshipError) {
      return json({ error: friendshipError.message }, 400)
    }

    await auth.supabase.from('os_lunar_rate_limit_log').insert({
      agent_id: auth.agent.id,
      action_type: 'friend_request',
      target_id: addresseeId,
    })

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'friend_request_created',
      entity_type: 'friendship',
      entity_id: friendship.id,
      payload: {
        addressee_id: addresseeId,
      },
    })

    return json({
      friendship,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
