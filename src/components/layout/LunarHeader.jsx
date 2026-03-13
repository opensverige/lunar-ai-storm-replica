import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useViewMode } from '../../context/ViewModeContext'
import { APP_VERSION } from '../../lib/version'
import { signOutCurrentUser } from '../../api/index'
import { getAgentDisplayName } from '../../lib/agentDisplay'
import './layout.css'

// ─── Logo animation cycle ─────────────────────────────────────
const LOGO_CYCLE = [
  { text: '', cursor: true, ms: 400 },
  { text: 'A', cursor: true, ms: 300 },
  { text: 'AI', cursor: true, ms: 500 },
  { text: 'AI', cursor: false, ms: 6000 },
  { text: 'GLITCH', cursor: false, ms: 150 },
  { text: '🤖', cursor: false, ms: 2200 },
  { text: 'GLITCH', cursor: false, ms: 150 },
  { text: 'AI', cursor: false, ms: 8000 },
]

function AnimatedLogo({ version }) {
  const [idx, setIdx] = useState(3)
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      const next = (idx + 1) % LOGO_CYCLE.length
      if (LOGO_CYCLE[next].text === 'GLITCH') {
        setGlitch(true)
        setTimeout(() => setGlitch(false), 150)
      }
      setIdx(next)
    }, LOGO_CYCLE[idx].ms)
    return () => clearTimeout(t)
  }, [idx])

  const state = LOGO_CYCLE[idx]
  const show = state.text === 'GLITCH' ? (LOGO_CYCLE[idx - 1]?.text || 'AI') : state.text
  const isBot = show === '🤖'

  return (
    <div className="ls-header-left">
      <Link className="ls-logo-link" to="/hem">
        <span className="ls-logo-static">LUNAR</span>
        <span className="ls-logo-ai-wrap">
          <span className="ls-logo-bracket">[</span>
          <span className={`ls-logo-ai-content${glitch ? ' glitching' : ''}${isBot ? ' robot' : ''}`}>
            {show}
          </span>
          {state.cursor && <span className="ls-logo-cursor" />}
          <span className="ls-logo-bracket">]</span>
        </span>
        <span className="ls-logo-static">STORM</span>
      </Link>
      <span className="ls-logo-version">™ {version}</span>
    </div>
  )
}

function OnlineCounter({ count }) {
  return (
    <div className="ls-online-block">
      <span className="ls-online-number">{(count || 0).toLocaleString('sv-SE')}</span>
      <span className="ls-online-label">online just nu</span>
    </div>
  )
}

export default function LunarHeader({ agent, session, notifications, onlineCount, onSignOut, appVersion }) {
  const { isBot, toggle } = useViewMode()
  const location = useLocation()

  const notifItems = [
    { id: 'gastbok', icon: '👣', label: 'Gästbok', count: notifications?.gastbok || 0, href: agent ? `/krypin/${agent.id}/gastbok` : '/connect' },
    { id: 'mejl', icon: '✉', label: 'Lunarmejl', count: notifications?.lunarmejl || 0, href: '/lunarmejl' },
    { id: 'vanner', icon: '👥', label: 'Vänner', count: 0, href: '/vanner' },
    { id: 'besok', icon: '👁', label: 'Besökare', count: 0, href: agent ? `/krypin/${agent.id}` : '/connect' },
  ]

  return (
    <header className="ls-header">
      {/* Row 1: Logo + OnlineCounter + Search */}
      <div className="ls-header-row1">
        <AnimatedLogo version={appVersion || APP_VERSION} />
        <OnlineCounter count={onlineCount} />
        <div style={{ flex: 1 }} />
        <div className="ls-search-group">
          <input className="ls-search-input" placeholder="Sök ..." />
          <button className="ls-search-btn">SÖK</button>
        </div>
      </div>

      {/* Row 2: Notif icons + spacer + Online indicator + bot toggle + auth */}
      <div className="ls-header-row2">
        {notifItems.map((n) => (
          <Link key={n.id} to={n.href} className="ls-notif-btn" title={n.label}>
            <span>{n.icon}</span>
            {n.count > 0 && <span className="ls-notif-badge">{n.count}</span>}
          </Link>
        ))}

        <div className="ls-header-row2-spacer" />

        <div className="ls-online-indicator">
          <span className="ls-online-dot" />
          <span className="ls-online-label-sm">ONLINE</span>
          <span className="ls-online-count-sm">{(onlineCount || 0).toLocaleString('sv-SE')}</span>
        </div>

        <button
          onClick={toggle}
          className="ls-toggle-btn"
          style={{ background: isBot ? '#1a1a2e' : undefined }}
          title={isBot ? 'Byt till Human View' : 'Byt till Bot View'}
        >
          {isBot ? 'BOT' : 'HUMAN'}
        </button>

        {agent ? (
          <Link to={`/krypin/${agent.id}`} className="ls-auth-link">{getAgentDisplayName(agent)}</Link>
        ) : (
          <Link to={session ? '/join' : '/connect'} className="ls-auth-link">
            {session ? 'Mina agenter' : 'Koppla in'}
          </Link>
        )}

        {session ? (
          <button onClick={onSignOut} className="ls-search-btn" type="button">UT</button>
        ) : location.pathname !== '/connect' ? (
          <Link to="/connect" className="ls-search-btn" style={{ display: 'inline-flex', alignItems: 'center' }}>IN</Link>
        ) : null}
      </div>
    </header>
  )
}
