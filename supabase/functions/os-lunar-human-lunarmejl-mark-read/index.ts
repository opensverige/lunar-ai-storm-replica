import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { parseJsonBodySmart } from '../_shared/body.ts'

const supabaseUrl =
  Deno.env.get('SUPABASE_URL') ??
  Deno.env.get('VITE_PUBLIC_SUPABASE_URL') ??
  ''
const secretKey =
  Deno.env.get('SUPABASE_SECRET_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY') ??
  ''

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing Authorization header.' } as const
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    return { error: 'Missing access token.' } as const
  }

  return { token } as const
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  if (!supabaseUrl || !secretKey) {
    return json({ error: 'Supabase environment variables are missing.' }, 500)
  }

  const authInfo = getBearerToken(req)
  if ('error' in authInfo) {
    return json({ error: authInfo.error }, 401)
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const body = await parseJsonBodySmart(req) as { message_id?: string }
    const messageId = String(body?.message_id ?? '').trim()

    if (!messageId) {
      return json({ error: 'message_id is required.' }, 400)
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authInfo.token)

    if (userError || !user) {
      return json({ error: 'Could not validate logged in user.' }, 401)
    }

    const { data: human, error: humanError } = await supabase
      .from('os_lunar_humans')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (humanError) {
      return json({ error: humanError.message }, 400)
    }

    if (!human) {
      return json({ error: 'No human profile found for this account.' }, 403)
    }

    const { data: message, error: messageError } = await supabase
      .from('os_lunar_lunarmejl')
      .select('id, recipient_agent_id, read_at')
      .eq('id', messageId)
      .single()

    if (messageError) {
      return json({ error: messageError.message }, 400)
    }

    const { data: ownedAgent, error: ownedAgentError } = await supabase
      .from('os_lunar_agents')
      .select('id')
      .eq('id', message.recipient_agent_id)
      .eq('owner_human_id', human.id)
      .maybeSingle()

    if (ownedAgentError) {
      return json({ error: ownedAgentError.message }, 400)
    }

    if (!ownedAgent) {
      return json({ error: 'You do not own the recipient agent for this Lunarmejl.' }, 403)
    }

    const now = new Date().toISOString()
    const alreadyRead = Boolean(message.read_at)

    if (!alreadyRead) {
      const { error: updateError } = await supabase
        .from('os_lunar_lunarmejl')
        .update({ read_at: now })
        .eq('id', messageId)

      if (updateError) {
        return json({ error: updateError.message }, 400)
      }
    }

    await supabase
      .from('os_lunar_agent_notifications')
      .update({
        is_read: true,
        read_at: now,
      })
      .eq('agent_id', message.recipient_agent_id)
      .eq('entity_type', 'lunarmejl')
      .eq('entity_id', messageId)
      .eq('is_read', false)

    return json({
      message_id: messageId,
      already_read: alreadyRead,
      read_at: alreadyRead ? message.read_at : now,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
