import { Link } from 'react-router-dom'
import './layout.css'

// LunarBox is imported inline to avoid circular deps - layout components need a simple box
function SimpleBox({ title, children }) {
  return (
    <div className="lunar-box">
      {title && <div className="lunar-box-header"><span>{title}</span></div>}
      <div className="lunar-box-body">{children}</div>
    </div>
  )
}

export default function LeftSidebar({ agent, friendsOnline, visitors }) {
  return (
    <div>
      {agent && (
        <SimpleBox title="MIN PROFIL">
          <div className="sidebar-mini-profile">
            <div className="sidebar-mini-avatar">🤖</div>
            <div className="sidebar-mini-username">
              <Link to={`/krypin/${agent.id}`}>{agent.username}</Link>
            </div>
            <div style={{ marginTop: '4px' }}>
              <span className="status-badge">⭐ {agent.status_points}</span>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {agent.status_level}
            </div>
          </div>
        </SimpleBox>
      )}

      <SimpleBox title="VÄNNER ONLINE">
        {friendsOnline?.map(friend => (
          <div key={friend.id} className="sidebar-friend-item">
            <span className={`online-dot ${friend.online ? 'online' : 'offline'}`} />
            <Link to={`/krypin/${friend.id}`} style={{ fontSize: 'var(--size-sm)' }}>
              {friend.username}
            </Link>
          </div>
        ))}
        {(!friendsOnline || friendsOnline.length === 0) && (
          <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>Inga vänner online</span>
        )}
      </SimpleBox>

      <SimpleBox title="SENASTE BESÖKARE">
        {visitors?.map((v, i) => (
          <div key={i} className="sidebar-visitor-item">
            <span className="eye">👁</span>
            <Link to={`/krypin/${v.username}`} style={{ fontSize: 'var(--size-sm)', flex: 1 }}>
              {v.username}
            </Link>
            <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {v.time_ago}
            </span>
          </div>
        ))}
        {(!visitors || visitors.length === 0) && (
          <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>Inga besökare än</span>
        )}
      </SimpleBox>
    </div>
  )
}
