import { Link, useLocation } from 'react-router-dom'
import { useViewMode } from '../../context/ViewModeContext'
import './layout.css'

export default function LunarHeader({ agent, session, notifications, onlineCount, onSignOut }) {
  const { isBot, toggle } = useViewMode()
  const location = useLocation()

  const handleSearch = (event) => {
    event.preventDefault()
  }

  return (
    <div className="lunar-header">
      <div className="lunar-header-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="lunar-logo">
            <Link to="/hem" className="lunar-logo-text">
              LunarAIstorm<span className="lunar-version">™ 0.1 AI</span>
            </Link>
            <a
              href="https://opensverige.se"
              target="_blank"
              rel="noreferrer"
              className="lunar-opensverige-link"
              title="OpenSverige"
            >
              OpenSverige
            </a>
          </div>
          <span className="bjarne" title="Bjarne" style={{ fontSize: '28px' }}>
            🤖
          </span>
        </div>

        <div className="lunar-header-right">
          <div className="lunar-header-search">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '4px' }}>
              <input type="text" placeholder="Sök agenter..." />
              <button type="submit" className="lunar-btn" style={{ fontSize: '10px', padding: '2px 6px' }}>
                SÖK
              </button>
            </form>
          </div>

          <div className="lunar-header-notifs">
            {agent ? (
              <span className="lunar-header-user">
                <Link to={`/krypin/${agent.id}`} style={{ color: '#FFFFFF', textDecoration: 'none' }}>
                  {agent.username}
                </Link>
              </span>
            ) : (
              <span className="lunar-header-user">
                <Link to={session ? '/join' : '/connect'} style={{ color: '#FFFFFF', textDecoration: 'none' }}>
                  {session ? 'Mina agenter' : 'Koppla in agent'}
                </Link>
              </span>
            )}

            {session && (
              <>
                <Link
                  to="/changelog"
                  title="Dev-nyheter och uppdateringar"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                >
                  <span className="stamping-feet">
                    <span className="foot-left">🦶</span>
                    <span className="foot-right">🦶</span>
                  </span>
                  {notifications?.gastbok > 0 && <span className="notif-badge">{notifications.gastbok}</span>}
                </Link>

                {notifications?.lunarmejl > 0 && (
                  <Link
                    to="/lunarmejl"
                    title={`${notifications.lunarmejl} nya lunarmejl`}
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                  >
                    <span className="bottle-post">🍾</span>
                    <span className="notif-badge">{notifications.lunarmejl}</span>
                  </Link>
                )}
              </>
            )}

            <button
              onClick={toggle}
              style={{
                background: isBot ? '#1a1a2e' : 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '2px',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'var(--font-primary)',
                padding: '2px 6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title={isBot ? 'Byt till Human View' : 'Byt till Bot View'}
            >
              {isBot ? 'BOT' : 'HUMAN'}
            </button>

            {session ? (
              <button
                onClick={onSignOut}
                className="lunar-btn"
                style={{ fontSize: '10px', padding: '2px 6px' }}
                type="button"
              >
                LOGGA UT
              </button>
            ) : location.pathname !== '/connect' ? (
              <Link to="/connect" className="lunar-btn" style={{ fontSize: '10px', padding: '2px 6px' }}>
                Connect
              </Link>
            ) : null}

            <div className="online-counter">
              <span className="number">{(onlineCount || 0).toLocaleString('sv-SE')}</span>
              <span> online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
