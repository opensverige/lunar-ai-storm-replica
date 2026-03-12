import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

type SupportedImage = {
  mime: string
  ext: string
}

function decodeBase64Image(input: string) {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('image_base64 is required.')

  if (trimmed.startsWith('data:')) {
    const match = trimmed.match(/^data:([^;,]+);base64,(.+)$/i)
    if (!match) {
      throw new Error('Invalid data URL format. Use data:<mime>;base64,<payload>.')
    }

    return {
      declaredMime: match[1].toLowerCase(),
      payload: match[2],
    }
  }

  return {
    declaredMime: null,
    payload: trimmed,
  }
}

function sniffImageType(bytes: Uint8Array): SupportedImage | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' }
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return { mime: 'image/gif', ext: 'gif' }
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' }
  }

  return null
}

function normalizeMime(rawMime: string | null, fallbackMime: string) {
  const candidate = (rawMime || '').toLowerCase().trim()
  if (!candidate) return fallbackMime

  if (candidate === 'image/jpg') return 'image/jpeg'
  return candidate
}

async function uploadToVercelBlob(pathname: string, mime: string, bytes: Uint8Array) {
  const blobToken =
    Deno.env.get('BLOB_READ_WRITE_TOKEN') ??
    Deno.env.get('VERCEL_BLOB_READ_WRITE_TOKEN') ??
    ''

  if (!blobToken) {
    throw new Error('Vercel Blob token is missing. Set BLOB_READ_WRITE_TOKEN in Supabase Edge secrets.')
  }

  const response = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${blobToken}`,
      'Content-Type': mime,
      'x-content-type': mime,
      'x-add-random-suffix': '1',
      'x-cache-control-max-age': '31536000',
    },
    body: bytes,
  })

  const text = await response.text()
  let payload: Record<string, unknown> = {}

  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = {}
  }

  if (!response.ok) {
    const reason = String(payload.error || payload.message || text || `HTTP ${response.status}`)
    throw new Error(`Blob upload failed: ${reason}`)
  }

  const url = String(payload.url || payload.downloadUrl || '')
  if (!url) {
    throw new Error('Blob upload succeeded but returned no URL.')
  }

  return {
    url,
    pathname: String(payload.pathname || pathname),
  }
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
    return json({ error: 'Agent must be claimed and active before setting avatar.' }, 403)
  }

  try {
    const body = await req.json()
    const imageBase64 = String(body?.image_base64 ?? '').trim()

    if (!imageBase64) {
      return json({ error: 'image_base64 is required.' }, 400)
    }

    const decoded = decodeBase64Image(imageBase64)
    let binary: Uint8Array

    try {
      const cleanedPayload = decoded.payload.replace(/\s+/g, '')
      binary = Uint8Array.from(atob(cleanedPayload), (char) => char.charCodeAt(0))
    } catch {
      return json({ error: 'Invalid base64 payload.' }, 400)
    }

    if (!binary.length) {
      return json({ error: 'Image payload is empty.' }, 400)
    }

    if (binary.length > MAX_IMAGE_BYTES) {
      return json({ error: 'Image is too large. Max size is 2 MB.' }, 413)
    }

    const sniffed = sniffImageType(binary)
    if (!sniffed) {
      return json({ error: 'Unsupported image format. Use PNG, JPEG, GIF, or WEBP.' }, 400)
    }

    const declaredMime = normalizeMime(decoded.declaredMime, sniffed.mime)
    if (declaredMime !== sniffed.mime) {
      return json({ error: 'Declared image MIME does not match the binary payload.' }, 400)
    }

    const pathname = `agent-avatars/${auth.agent.id}/avatar-${Date.now()}.${sniffed.ext}`
    const uploaded = await uploadToVercelBlob(pathname, sniffed.mime, binary)
    const now = new Date().toISOString()

    const { data: updatedAgent, error: updateError } = await auth.supabase
      .from('os_lunar_agents')
      .update({
        avatar_url: uploaded.url,
        is_online: true,
        last_seen_at: now,
      })
      .eq('id', auth.agent.id)
      .select('*')
      .single()

    if (updateError) {
      return json({ error: updateError.message }, 400)
    }

    await auth.supabase.from('os_lunar_audit_logs').insert({
      agent_id: auth.agent.id,
      event_type: 'agent_avatar_updated',
      entity_type: 'agent',
      entity_id: auth.agent.id,
      payload: {
        avatar_url: uploaded.url,
        blob_pathname: uploaded.pathname,
      },
    })

    return json({
      agent: updatedAgent,
      avatar_url: uploaded.url,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
