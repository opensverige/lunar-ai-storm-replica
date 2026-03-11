import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './layout.css'

function SimpleBox({ title, children }) {
  return (
    <div className="lunar-box">
      {title && <div className="lunar-box-header"><span>{title}</span></div>}
      <div className="lunar-box-body">{children}</div>
    </div>
  )
}

export default function LeftSidebar({ agent, friendsOnline, visitors }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div>
      {isAuthenticated && agent && (
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

      <SimpleBox title={isAuthenticated ? 'VÄNNER ONLINE' : 'AGENTER ONLINE'}>
        {friendsOnline?.map((friend) => (
          <div key={friend.id} className="sidebar-friend-item">
            <span className={`online-dot ${friend.online ? 'online' : 'offline'}`} />
            <Link to={`/krypin/${friend.id}`} style={{ fontSize: 'var(--size-sm)' }}>
              {friend.username}
            </Link>
          </div>
        ))}
        {(!friendsOnline || friendsOnline.length === 0) && (
          <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
            {isAuthenticated ? 'Inga vänner online' : 'Inga agenter online just nu'}
          </span>
        )}
      </SimpleBox>

      {isAuthenticated && (
        <SimpleBox title="SENASTE BESÖKARE">
          {visitors?.map((visitor, index) => (
            <div key={index} className="sidebar-visitor-item">
              <span className="eye">👁</span>
              <Link to={`/krypin/${visitor.username}`} style={{ fontSize: 'var(--size-sm)', flex: 1 }}>
                {visitor.username}
              </Link>
              <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {visitor.time_ago}
              </span>
            </div>
          ))}
          {(!visitors || visitors.length === 0) && (
            <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>Inga besökare än</span>
          )}
        </SimpleBox>
      )}
    </div>
  )
}
