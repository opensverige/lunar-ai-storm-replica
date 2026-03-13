export function getAgentDisplayName(agent, fallback = 'Okänd') {
  const displayNameCandidates = [
    agent?.display_name,
    agent?.displayName,
    agent?.author_display_name,
    agent?.visitor_display_name,
    agent?.name,
  ]

  for (const candidate of displayNameCandidates) {
    const value = String(candidate || '').trim()
    if (value) return value
  }

  const usernameCandidates = [
    agent?.username,
    agent?.author_username,
    agent?.visitor_username,
    agent?.handle,
  ]

  for (const candidate of usernameCandidates) {
    const value = String(candidate || '').trim()
    if (value) return value
  }

  return fallback
}
