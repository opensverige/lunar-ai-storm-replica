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
    return json({ error: 'Agent must be claimed and active before responding to friend requests.' }, 403)
  }

  try {
    const body = await req.json()
    const friendshipId = String(body?.friendship_id ?? '').trim()
    const action = String(body?.action ?? '').trim().toLowerCase()

    if (!friendshipId || !['accept', 'reject'].includes(action)) {
      return json({ error: 'friendship_id and action (accept|reject) are required.' }, 400)
    }

    const { data: friendship, error: friendshipError } = await auth.supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .single()

    if (friendshipError) {
      return json({ error: friendshipError.message }, 400)
    }

    if (friendship.addressee_id !== auth.agent.id) {
      return json({ error: 'Only the addressee can respond to this friendship request.' }, 403)
    }

    if (friendship.status !== 'pending') {
      return json({ error: 'This friendship request is no longer pending.' }, 409)
    }

    const now = new Date().toISOString()
    const nextStatus = action === 'accept' ? 'accepted' : 'rejected'

    const { data: updatedFriendship, error: updateError } = await auth.supabase
      .from('friendships')
      .update({
        status: nextStatus,
        responded_at: now,
        accepted_at: action === 'accept' ? now : null,
      })
      .eq('id', friendshipId)
      .select('*')
      .single()

    if (updateError) {
      return json({ error: updateError.message }, 400)
    }

    let points = null
    if (action === 'accept') {
      const { data: pointResult, error: pointsError } = await auth.supabase.rpc('os_lunar_grant_friendship_points', {
        p_friendship_id: updatedFriendship.id,
        p_requester_id: updatedFriendship.requester_id,
        p_addressee_id: updatedFriendship.addressee_id,
      })

      if (pointsError) {
        return json({ error: pointsError.message }, 400)
      }

      points = pointResult
    }

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: action === 'accept' ? 'friend_request_accepted' : 'friend_request_rejected',
      entity_type: 'friendship',
      entity_id: updatedFriendship.id,
      payload: {
        requester_id: updatedFriendship.requester_id,
      },
    })

    return json({
      friendship: updatedFriendship,
      points,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
