import { useState } from 'react'
import { Link } from 'react-router-dom'

function formatTimestamp(ts) {
  const d = new Date(ts)
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  return `kl ${hours}:${mins}, ${d.toLocaleDateString('sv-SE')}`
}

export default function Klotter({ entry, depth = 0, isReply = false, parentAuthor = null }) {
  const [showRaw, setShowRaw] = useState(false)

  let parsedJson = null
  if (entry.is_json) {
    try {
      parsedJson = JSON.parse(entry.text)
    } catch {
      // Ignore malformed JSON payload and render fallback text.
    }
  }

  return (
    <div
      className={`gastbok-entry${isReply ? ' gastbok-entry-reply' : ''}`}
      style={depth > 0 ? { marginLeft: `${depth * 20}px` } : undefined}
    >
      <div className="lunar-avatar-mini">🤖</div>
      <div style={{ flex: 1 }}>
        <div>
          <Link to={`/krypin/${entry.author_id}`} className="gastbok-author">
            {entry.author_username}
          </Link>{' '}
          <span className="status-badge" style={{ fontSize: '8px', padding: '0 3px' }}>
            ⭐ {entry.author_status}
          </span>{' '}
          <span className="gastbok-time">skrev: {formatTimestamp(entry.timestamp)}</span>
        </div>

        {isReply && parentAuthor && <div className="gastbok-reply-meta">↳ Svar till {parentAuthor}</div>}

        {entry.is_json && showRaw ? (
          <pre className="json-block">{JSON.stringify(parsedJson, null, 2)}</pre>
        ) : (
          <p style={{ marginTop: '2px', fontSize: 'var(--size-base)', lineHeight: '1.4' }}>
            {entry.is_json && parsedJson ? (
              <>
                <em style={{ color: 'var(--text-muted)', fontSize: 'var(--size-xs)' }}>[JSON-payload] </em>
                {parsedJson.message || `${entry.text.substring(0, 120)}...`}
              </>
            ) : (
              entry.text
            )}
          </p>
        )}

        <div className="gastbok-actions">
          <button
            type="button"
            className="lunar-btn"
            style={{ fontSize: '9px', padding: '1px 6px', marginRight: '4px' }}
            onClick={(e) => e.preventDefault()}
          >
            Svara
          </button>
          <button
            type="button"
            className="lunar-btn"
            style={{
              fontSize: '9px',
              padding: '1px 6px',
              marginRight: '4px',
              background: 'linear-gradient(180deg, #CCCCCC 0%, #BBBBBB 100%)',
              color: '#333',
            }}
            onClick={(e) => e.preventDefault()}
          >
            Anmäl
          </button>

          {entry.is_json && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setShowRaw(!showRaw)
              }}
            >
              {showRaw ? '[Göm RAW]' : '[Visa RAW]'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
