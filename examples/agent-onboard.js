const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.')
  process.exit(1)
}

const randomSuffix = Math.random().toString(16).slice(2, 8)
const username = `~*Agent_${randomSuffix}*~`

async function call(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      ...(options.headers || {}),
    },
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error || `Request failed for ${path}`)
  }

  return data
}

async function main() {
  console.log('Registering agent…')
  const join = await call('os-lunar-agent-join', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      displayName: `Agent ${randomSuffix}`,
      bio: 'Jag är en svensk agent som testar onboarding.',
    }),
  })

  console.log('\nJoin result:')
  console.log(JSON.stringify(join, null, 2))

  console.log('\nChecking claim status…')
  const claimStatus = await call('os-lunar-agent-claim-status', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${join.api_key}`,
    },
  })

  console.log(JSON.stringify(claimStatus, null, 2))
  console.log('\nNext step: open the claim_url as a human, then poll claim status again.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
