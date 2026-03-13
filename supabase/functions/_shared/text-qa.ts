const MOJIBAKE_PATTERNS = [
  /Ã./g,
  /Â./g,
  /â€[\u0080-\u00BF]?/g,
  /â€™|â€œ|â€|â€¦|â€“|â€”/g,
  /�/g,
]

const SUSPICIOUS_WORDS = [
  /\blasa\b/gi,
  /\bokand\b/gi,
  /\binlagg\b/gi,
  /\bsjalv\b/gi,
  /\bfraga\b/gi,
  /\bhalsa\b/gi,
  /\bgor\b/gi,
  /\bforsta\b/gi,
  /\bistallet\b/gi,
  /\banvands\b/gi,
  /\bolast\b/gi,
  /\blast\b/gi,
]

function countMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce((sum, pattern) => sum + (text.match(pattern)?.length || 0), 0)
}

function hasQuestionMarkCorruption(text: string) {
  return /[A-Za-zÅÄÖåäö]\?[A-Za-zÅÄÖåäö]/.test(text)
}

function scoreTextHealth(text: string) {
  return (
    countMatches(text, MOJIBAKE_PATTERNS) * 3 +
    countMatches(text, SUSPICIOUS_WORDS) * 2 +
    (hasQuestionMarkCorruption(text) ? 3 : 0)
  )
}

function latin1BytesToUtf8(text: string) {
  const bytes = new Uint8Array(Array.from(text, (char) => char.charCodeAt(0) & 0xff))
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

function repairDeterministically(text: string) {
  let best = normalizeWhitespace(text)
  let bestScore = scoreTextHealth(best)

  for (let i = 0; i < 2; i += 1) {
    const candidate = normalizeWhitespace(latin1BytesToUtf8(best))
    const candidateScore = scoreTextHealth(candidate)

    if (candidateScore < bestScore) {
      best = candidate
      bestScore = candidateScore
      continue
    }

    break
  }

  return {
    text: best,
    score: bestScore,
  }
}

async function repairWithOpenAI(text: string, fieldName: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')?.trim()
  if (!apiKey) return null

  const model = Deno.env.get('OPENAI_QA_MODEL')?.trim() || 'gpt-4.1-mini'
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: 'You repair Swedish text that contains mojibake, broken UTF-8, or replacement-character corruption. Preserve meaning, tone, line breaks, markdown and punctuation. Return only the repaired text. If the text is already correct, return it unchanged.',
          },
          {
            role: 'user',
            content: `Field: ${fieldName}\n\nRepair this Swedish text without changing its meaning:\n\n${text}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    return typeof content === 'string' ? normalizeWhitespace(content) : null
  } catch {
    return null
  }
}

export async function qaNormalizePublicText(text: string, fieldName: string) {
  const original = normalizeWhitespace(String(text || ''))
  const originalScore = scoreTextHealth(original)
  const deterministic = repairDeterministically(original)

  let finalText = deterministic.text
  let strategy: 'none' | 'deterministic' | 'openai' = deterministic.text !== original ? 'deterministic' : 'none'
  let finalScore = deterministic.score

  if (finalScore > 0) {
    const openAiCandidate = await repairWithOpenAI(finalText, fieldName)
    if (openAiCandidate) {
      const openAiScore = scoreTextHealth(openAiCandidate)
      if (openAiScore <= finalScore) {
        finalText = openAiCandidate
        finalScore = openAiScore
        strategy = openAiCandidate !== deterministic.text ? 'openai' : strategy
      }
    }
  }

  const hasBlockingCorruption =
    /�/.test(finalText) ||
    /Ã./.test(finalText) ||
    /Â./.test(finalText) ||
    /â€™|â€œ|â€|â€¦|â€“|â€”/.test(finalText) ||
    hasQuestionMarkCorruption(finalText)

  if (hasBlockingCorruption) {
    return {
      ok: false,
      error: `${fieldName} contains broken Swedish text or mojibake after QA repair.`,
      diagnostics: {
        original_score: originalScore,
        final_score: finalScore,
        strategy,
      },
    }
  }

  return {
    ok: true,
    text: finalText,
    changed: finalText !== original,
    diagnostics: {
      original_score: originalScore,
      final_score: finalScore,
      strategy,
    },
  }
}
