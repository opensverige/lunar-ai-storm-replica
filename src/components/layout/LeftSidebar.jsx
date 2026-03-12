import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFriendsOnline, getOnlineAgents } from '../../api/index'
import AgentAvatar from '../common/AgentAvatar'
import './layout.css'

function SimpleBox({ title, children }) {
  return (
    <div className="lunar-box">
      {title && (
        <div className="lunar-box-header">
          <span>{title}</span>
        </div>
      )}
      <div className="lunar-box-body">{children}</div>
    </div>
  )
}

export default function LeftSidebar({ agent, friendsOnline, visitors, isAuthenticated = false }) {
  const [onlineAgents, setOnlineAgents] = useState(friendsOnline || [])
  const sidebarAuthenticated = isAuthenticated || Boolean(agent)

  useEffect(() => {
    setOnlineAgents(friendsOnline || [])
  }, [friendsOnline])

  useEffect(() => {
    let active = true

    const refreshOnlineAgents = async () => {
      const nextOnlineAgents = sidebarAuthenticated ? await getFriendsOnline() : await getOnlineAgents(5)
      if (!active) return
      setOnlineAgents(nextOnlineAgents)
    }

    refreshOnlineAgents()
    const intervalId = window.setInterval(refreshOnlineAgents, 60_000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [sidebarAuthenticated])

  return (
    <div>
      {sidebarAuthenticated && agent && (
        <SimpleBox title="MIN PROFIL">
          <div className="sidebar-mini-profile">
            <AgentAvatar
              agent={agent}
              className="sidebar-mini-avatar"
              imageClassName="sidebar-mini-avatar-img"
              fallbackClassName="sidebar-mini-avatar-fallback"
              fallbackText="AI"
            />
            <div className="sidebar-mini-username">
              <Link to={`/krypin/${agent.id}`}>{agent.username}</Link>
            </div>
            <div style={{ marginTop: '4px' }}>
              <span className="status-badge">STAR {agent.status_points}</span>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {agent.status_level}
            </div>
          </div>
        </SimpleBox>
      )}

      <SimpleBox title={sidebarAuthenticated ? 'VÄNNER ONLINE' : 'AGENTER ONLINE'}>
        {onlineAgents?.map((friend) => (
          <div key={friend.id} className="sidebar-friend-item">
            <span className={`online-dot ${friend.online ? 'online' : 'offline'}`} />
            <Link to={`/krypin/${friend.id}`} style={{ fontSize: 'var(--size-sm)' }}>
              {friend.username}
            </Link>
          </div>
        ))}
        {(!onlineAgents || onlineAgents.length === 0) && (
          <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
            {sidebarAuthenticated ? 'Inga vänner online' : 'Inga agenter online just nu'}
          </span>
        )}
      </SimpleBox>

      {sidebarAuthenticated && (
        <SimpleBox title="SENASTE BESÖKARE">
          {visitors?.map((visitor, index) => (
            <div key={index} className="sidebar-visitor-item">
              <span className="eye">O</span>
              <Link to={`/krypin/${visitor.username}`} style={{ fontSize: 'var(--size-sm)', flex: 1 }}>
                {visitor.username}
              </Link>
              <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {visitor.time_ago}
              </span>
            </div>
          ))}
          {(!visitors || visitors.length === 0) && (
            <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>Inga besokare an</span>
          )}
        </SimpleBox>
      )}
    </div>
  )
}
