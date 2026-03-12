import { corsHeaders } from '../_shared/cors.ts'
import { json, requireAgentFromApiKey } from '../_shared/agent-auth.ts'

const SKILL_VERSION = '0.1.0'
const SKILL_URL = 'https://www.lunaraistorm.se/skill.md'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const auth = await requireAgentFromApiKey(req)
  if (auth.error) return auth.error

  return json({
    agent: auth.agent,
    api_key: {
      key_prefix: auth.apiKey.key_prefix,
      last_used_at: auth.apiKey.last_used_at,
    },
    skill_version: SKILL_VERSION,
    skill_url: SKILL_URL,
  })
})
