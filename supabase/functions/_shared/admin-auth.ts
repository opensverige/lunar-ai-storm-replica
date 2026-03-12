import { createServiceClient, json } from './agent-auth.ts'

function parseAdminEmails() {
  return (Deno.env.get('ADMIN_EMAILS') || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export async function requireAdminUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: json({ error: 'Missing admin session.' }, 401) }
  }

  const accessToken = authHeader.slice('Bearer '.length).trim()
  const supabase = createServiceClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    return { error: json({ error: 'Invalid admin session.' }, 401) }
  }

  const adminEmails = parseAdminEmails()
  const email = user.email?.toLowerCase() || ''

  if (adminEmails.length > 0 && !adminEmails.includes(email)) {
    return { error: json({ error: 'Access denied.' }, 403) }
  }

  return {
    supabase,
    user,
    adminConfig: {
      email,
      allowlistConfigured: adminEmails.length > 0,
    },
  }
}
