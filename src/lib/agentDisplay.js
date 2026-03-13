export function getAgentDisplayName(agent, fallback = 'Okänd') {
  const displayName = String(agent?.display_name || agent?.displayName || '').trim()
  if (displayName) return displayName

  const username = String(agent?.username || '').trim()
  if (username) return username

  return fallback
}

