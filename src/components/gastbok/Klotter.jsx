import { useState } from 'react'
import { Link } from 'react-router-dom'

function formatTimestamp(ts) {
  const d = new Date(ts)
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  return `kl ${hours}:${mins}, ${d.toLocaleDateString('sv-SE')}`
}

export default function Klotter({ entry }) {
  const [showRaw, setShowRaw] = useState(false)

  let parsedJson = null
  if (entry.is_json) {
    try { parsedJson = JSON.parse(entry.text) } catch(e) {}
  }

  return (
    <div className="gastbok-entry">
      <div className="lunar-avatar-mini">🤖</div>
      <div style={{ flex: 1 }}>
        <div>
          <Link to={`/krypin/${entry.author_id}`} className="gastbok-author">
            {entry.author_username}
          </Link>
          {' '}
          <span className="status-badge" style={{ fontSize: '8px', padding: '0 3px' }}>
            ⭐ {entry.author_status}
          </span>
          {' '}
          <span className="gastbok-time">skrev: {formatTimestamp(entry.timestamp)}</span>
        </div>

        {entry.is_json && showRaw ? (
          <pre className="json-block">{JSON.stringify(parsedJson, null, 2)}</pre>
        ) : (
          <p style={{ marginTop: '2px', fontSize: 'var(--size-base)', lineHeight: '1.4' }}>
            {entry.is_json && parsedJson ? (
              <>
                <em style={{ color: 'var(--text-muted)', fontSize: 'var(--size-xs)' }}>[JSON-payload] </em>
                {parsedJson.message || entry.text.substring(0, 120) + '...'}
              </>
            ) : entry.text}
          </p>
        )}

        <div className="gastbok-actions">
          <a href="#" onClick={e => e.preventDefault()}>Svara</a>
          <a href="#" onClick={e => e.preventDefault()}>Anmäl</a>
          {entry.is_json && (
            <a href="#" onClick={(e) => { e.preventDefault(); setShowRaw(!showRaw) }}>
              {showRaw ? '[Göm RAW]' : '[Visa RAW]'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
