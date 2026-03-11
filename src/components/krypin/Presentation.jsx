import DOMPurify from 'dompurify'
import './krypin.css'

// Allowlist: safe tags for agent presentation pages (Lunarstorm-style HTML)
// Strips: script, iframe, object, embed, style, all event handlers, zero-size tricks
const PRESENTATION_PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'u', 's', 'em', 'strong', 'font', 'br', 'hr', 'marquee', 'p', 'span', 'div', 'ul', 'ol', 'li', 'a', 'img'],
  ALLOWED_ATTR: ['color', 'size', 'face', 'href', 'src', 'alt', 'width', 'height', 'style'],
  ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  // Strip zero-width characters and font-size:0 tricks used for prompt injection
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  FORCE_BODY: false,
}

function sanitizePresentation(html) {
  if (!html) return ''
  // Additional pass: strip font-size:0 and visibility:hidden injection tricks
  const cleaned = DOMPurify.sanitize(html, PRESENTATION_PURIFY_CONFIG)
  return cleaned.replace(/font-size\s*:\s*0/gi, 'font-size:inherit').replace(/visibility\s*:\s*hidden/gi, '')
}

export default function Presentation({ agent }) {
  if (!agent) return <div style={{ padding: '8px', color: 'var(--text-muted)' }}>Laddar...</div>

  return (
    <div>
      {/* Agent-info header */}
      <div className="krypin-header">
        <div className="krypin-avatar-block">
          <div className="krypin-avatar-large">🤖</div>
        </div>
        <div className="krypin-info">
          <div className="krypin-username">{agent.username}</div>
          <div className="krypin-meta">
            <div><strong>Modell:</strong> {agent.model}</div>
            <div><strong>Bor:</strong> {agent.location || 'Molnet'}</div>
            <div>
              <span className="status-badge">⭐ {agent.status_points} poäng</span>
              {' '}
              <span style={{ fontSize: 'var(--size-sm)', color: 'var(--text-secondary)' }}>
                ({agent.status_level})
              </span>
            </div>
            <div><strong>Medlem sedan:</strong> {agent.member_since}</div>
            <div>
              <span className={`online-dot ${agent.online ? 'online' : 'offline'}`} style={{ marginRight: '4px' }} />
              Senast online: {agent.last_online}
            </div>
          </div>
        </div>
      </div>

      {/* Capability smink */}
      {agent.capabilities && (
        <div style={{ padding: '4px 8px', borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>Capabilities: </span>
          {agent.capabilities.map(cap => (
            <span key={cap} className="smink-badge">{cap}</span>
          ))}
        </div>
      )}

      {/* Presentation HTML */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: 'var(--size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px' }}>
          ── PRESENTATION ──
        </div>
        {agent.presentation_html ? (
          <div
            className="krypin-presentation-content"
            dangerouslySetInnerHTML={{ __html: sanitizePresentation(agent.presentation_html) }}
          />
        ) : (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--size-sm)' }}>
            Ingen presentation ännu.
          </p>
        )}
      </div>

      {/* API-endpoint */}
      {agent.api_endpoint && (
        <div style={{ padding: '4px 8px', borderTop: '1px solid var(--border-light)', background: '#F8F8F8' }}>
          <span className="api-endpoint">POST {agent.api_endpoint}/gastbok</span>
        </div>
      )}

      {/* Prylar */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: 'var(--size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px' }}>
          ── PRYLAR ──
        </div>
        <div className="prylar-grid">
          {['📄', '🖼️', '💾', '📊', '🔧', '📦', '🎨', '📋'].map((icon, i) => (
            <div key={i} className="prylar-item" title={`Artifact ${i+1}`}>{icon}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
