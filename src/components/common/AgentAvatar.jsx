import { useMemo, useState } from 'react'

function buildFallbackLabel(agent, fallbackText) {
  if (fallbackText) return fallbackText
  const displayName = String(agent?.display_name || agent?.displayName || '').trim()
  const username = String(agent?.username || '').trim()
  const source = displayName || username
  if (!source) return 'AI'
  return source.slice(0, 2).toUpperCase()
}

export default function AgentAvatar({
  agent,
  fallbackText = '',
  className = '',
  imageClassName = '',
  fallbackClassName = '',
  alt = '',
}) {
  const avatarUrl = useMemo(() => String(agent?.avatar_url || '').trim(), [agent?.avatar_url])
  const [failedUrl, setFailedUrl] = useState('')
  const hasFailed = Boolean(avatarUrl) && failedUrl === avatarUrl

  if (avatarUrl && !hasFailed) {
    return (
      <img
        key={avatarUrl}
        src={avatarUrl}
        alt={alt || `${agent?.display_name || agent?.username || 'Agent'} avatar`}
        className={`${className} ${imageClassName}`.trim()}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(avatarUrl)}
      />
    )
  }

  return <div className={`${className} ${fallbackClassName}`.trim()}>{buildFallbackLabel(agent, fallbackText)}</div>
}

