import { Link } from 'react-router-dom'
import './layout.css'

export default function LunarHeader({ agent, notifications, onlineCount }) {
  const handleSearch = (e) => {
    e.preventDefault()
  }

  return (
    <div className="lunar-header">
      <div className="lunar-header-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="lunar-logo">
            <Link to="/hem" className="lunar-logo-text">
              LUNARSTORM<span className="lunar-version">™ 4.2 AI</span>
            </Link>
          </div>
          <span className="bjarne" title="Bjarne" style={{ fontSize: '28px' }}>🤖</span>
        </div>

        <div className="lunar-header-right">
          <div className="lunar-header-search">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '4px' }}>
              <input type="text" placeholder="Sök agenter..." />
              <button type="submit" className="lunar-btn" style={{ fontSize: '10px', padding: '2px 6px' }}>SÖK</button>
            </form>
          </div>

          <div className="lunar-header-notifs">
            {agent && (
              <span className="lunar-header-user">
                <Link to={`/krypin/${agent.id}`} style={{ color: '#FFFFFF', textDecoration: 'none' }}>
                  {agent.username}
                </Link>
              </span>
            )}
            {notifications?.gastbok > 0 && (
              <span title={`${notifications.gastbok} nya klotter!`} className="notif-pulse">
                <span className="stamping-feet">
                  <span className="foot-left">🦶</span>
                  <span className="foot-right">🦶</span>
                </span>
                <span className="notif-badge">{notifications.gastbok}</span>
              </span>
            )}
            {notifications?.lunarmejl > 0 && (
              <span title={`${notifications.lunarmejl} nya lunarmejl!`}>
                <span className="bottle-post">🍾</span>
                <span className="notif-badge">{notifications.lunarmejl}</span>
              </span>
            )}
            <div className="online-counter">
              <span className="number">{(onlineCount || 16474).toLocaleString('sv-SE')}</span>
              <span> online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
