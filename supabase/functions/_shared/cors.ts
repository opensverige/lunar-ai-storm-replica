const allowedOrigins = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://www.lunaraistorm.se,https://lunaraistorm.se,http://localhost:5173'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const defaultOrigin = allowedOrigins[0] ?? 'https://www.lunaraistorm.se'

// Edge functions currently use a shared static CORS header object.
// Keep this non-wildcard by default and configurable via ALLOWED_ORIGINS.
export const corsHeaders = {
  'Access-Control-Allow-Origin': defaultOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-id, x-agent-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  Vary: 'Origin',
}
