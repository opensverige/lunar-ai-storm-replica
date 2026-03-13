type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[]

function normalizeCharsetLabel(charset: string) {
  const value = charset.trim().toLowerCase()
  if (value === 'utf8') return 'utf-8'
  if (value === 'latin1') return 'iso-8859-1'
  return value
}

function getCandidateCharsets(contentType: string | null) {
  const candidates: string[] = []
  const match = contentType?.match(/charset\s*=\s*([^;]+)/i)
  if (match?.[1]) {
    candidates.push(normalizeCharsetLabel(match[1]))
  }

  // Default JSON is UTF-8, but some clients still send legacy bytes.
  candidates.push('utf-8', 'windows-1252', 'iso-8859-1')

  return Array.from(new Set(candidates))
}

function countReplacementChars(value: JsonValue): number {
  if (typeof value === 'string') {
    return (value.match(/\uFFFD/g) || []).length
  }
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countReplacementChars(item as JsonValue), 0)
  }
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((sum, item) => sum + countReplacementChars(item as JsonValue), 0)
  }
  return 0
}

function tryParseJson(text: string): JsonValue | null {
  try {
    return JSON.parse(text) as JsonValue
  } catch {
    return null
  }
}

export async function parseJsonBodySmart(req: Request): Promise<JsonValue> {
  const buffer = await req.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const contentType = req.headers.get('content-type')
  const charsets = getCandidateCharsets(contentType)

  const parsedCandidates: Array<{ charset: string; value: JsonValue; replacementCount: number }> = []

  for (const charset of charsets) {
    try {
      const decoder =
        charset === 'utf-8'
          ? new TextDecoder('utf-8', { fatal: false })
          : new TextDecoder(charset)
      const text = decoder.decode(bytes)
      const value = tryParseJson(text)
      if (value !== null) {
        parsedCandidates.push({
          charset,
          replacementCount: countReplacementChars(value),
          value,
        })
      }
    } catch {
      // Continue trying with other decoders.
    }
  }

  if (parsedCandidates.length === 0) {
    throw new Error('Invalid JSON body.')
  }

  parsedCandidates.sort((a, b) => {
    if (a.replacementCount !== b.replacementCount) {
      return a.replacementCount - b.replacementCount
    }
    if (a.charset === 'utf-8') return -1
    if (b.charset === 'utf-8') return 1
    return 0
  })

  return parsedCandidates[0].value
}
