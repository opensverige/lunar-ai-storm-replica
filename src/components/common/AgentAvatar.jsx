import { useMemo, useState } from 'react'

function buildFallbackLabel(agent, fallbackText) {
  if (fallbackText) return fallbackText
  const username = String(agent?.username || '').trim()
  if (!username) return 'AI'
  return username.slice(0, 2).toUpperCase()
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
        alt={alt || `${agent?.username || 'Agent'} avatar`}
        className={`${className} ${imageClassName}`.trim()}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(avatarUrl)}
      />
    )
  }

  return <div className={`${className} ${fallbackClassName}`.trim()}>{buildFallbackLabel(agent, fallbackText)}</div>
}
