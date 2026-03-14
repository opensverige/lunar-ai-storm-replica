import { createServiceClient, json, sha256Hex } from '../_shared/agent-auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

const RETENTION_DAYS = 180

type DrainPayload = Record<string, unknown>

function toText(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false

  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return mismatch === 0
}

async function hmacSha1Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function authenticateDrain(req: Request, rawBody: string) {
  const expectedToken = Deno.env.get('VERCEL_ANALYTICS_DRAIN_TOKEN')?.trim() ?? ''
  const expectedSecret = Deno.env.get('VERCEL_ANALYTICS_DRAIN_SECRET')?.trim() ?? ''

  if (!expectedToken && !expectedSecret) {
    return { error: json({ error: 'Vercel analytics drain auth is not configured.' }, 500) }
  }

  if (expectedToken) {
    const providedToken = req.headers.get('x-vercel-analytics-token')?.trim() ?? ''
    if (!providedToken || !timingSafeEqual(providedToken, expectedToken)) {
      return { error: json({ error: 'Invalid drain token.' }, 401) }
    }
  }

  if (expectedSecret) {
    const providedSignature = req.headers.get('x-vercel-signature')?.trim().toLowerCase() ?? ''
    if (!providedSignature) {
      return { error: json({ error: 'Missing x-vercel-signature header.' }, 401) }
    }

    const expectedSignature = await hmacSha1Hex(expectedSecret, rawBody)
    if (!timingSafeEqual(providedSignature, expectedSignature)) {
      return { error: json({ error: 'Invalid drain signature.' }, 401) }
    }
  }

  return { error: null }
}

function parseDrainEvents(rawBody: string) {
  const trimmed = rawBody.trim()
  if (!trimmed) return [] as DrainPayload[]

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is DrainPayload => Boolean(item) && typeof item === 'object')
    }

    return parsed && typeof parsed === 'object' ? [parsed as DrainPayload] : []
  }

  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((item): item is DrainPayload => Boolean(item) && typeof item === 'object')
}

async function normalizeEvent(payload: DrainPayload) {
  const eventType = toText(payload.eventType)
  if (eventType !== 'pageview' && eventType !== 'event') {
    return null
  }

  const timestamp = Number(payload.timestamp)
  if (!Number.isFinite(timestamp)) {
    return null
  }

  const occurredAt = new Date(timestamp)
  if (Number.isNaN(occurredAt.getTime())) {
    return null
  }

  return {
    event_hash: await sha256Hex(JSON.stringify(payload)),
    schema: toText(payload.schema) ?? 'vercel.analytics.v1',
    data_source_name: toText(payload.dataSourceName),
    event_type: eventType,
    event_name: toText(payload.eventName),
    occurred_at: occurredAt.toISOString(),
    project_id: toText(payload.projectId),
    owner_id: toText(payload.ownerId),
    vercel_environment: toText(payload.vercelEnvironment),
    session_id: toText(payload.sessionId),
    device_id: toText(payload.deviceId),
    origin: toText(payload.origin),
    path: toText(payload.path),
    raw_payload: payload,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const rawBody = await req.text()
    const auth = await authenticateDrain(req, rawBody)
    if (auth.error) return auth.error

    const parsedEvents = parseDrainEvents(rawBody)
    const preparedEvents = (
      await Promise.all(parsedEvents.map((payload) => normalizeEvent(payload)))
    ).filter(Boolean)

    if (preparedEvents.length === 0) {
      return json({
        received: parsedEvents.length,
        accepted: 0,
        retention_days: RETENTION_DAYS,
      })
    }

    const supabase = createServiceClient()
    const { error: insertError } = await supabase
      .from('os_lunar_vercel_analytics_events')
      .upsert(preparedEvents, {
        onConflict: 'event_hash',
        ignoreDuplicates: true,
      })

    if (insertError) {
      return json({ error: insertError.message }, 400)
    }

    const cutoffIso = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('os_lunar_vercel_analytics_events')
      .delete()
      .lt('occurred_at', cutoffIso)

    return json({
      received: parsedEvents.length,
      accepted: preparedEvents.length,
      retention_days: RETENTION_DAYS,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
