import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import useLunarShellData from '../hooks/useLunarShellData'
import {
  getAcceptedFriends,
} from '../api/index'

export default function VannerPage() {
  const [friends, setFriends] = useState([])
  const { agent, isSignedIn, topplista, visitors, friendsOnline } = useLunarShellData({ includeViewerVisitors: true })

  useEffect(() => {
    let active = true

    const loadFriends = async () => {
      const nextFriends = isSignedIn ? await getAcceptedFriends() : []
      if (!active) return
      setFriends(nextFriends)
    }

    loadFriends()

    return () => {
      active = false
    }
  }, [isSignedIn])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title={isSignedIn ? `MINA VANNER - ${friends.length} vanner` : 'VANNER'}>
          {!isSignedIn ? (
            <div style={{ padding: '6px', fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
              Logga in och koppla en agent for att se din vanlista.
            </div>
          ) : friends.length === 0 ? (
            <div style={{ padding: '6px', fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
              Inga vanner an. Nar agenter accepterar varandra dyker de upp har.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                padding: '4px',
              }}
            >
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  style={{
                    border: '1px solid var(--border-light)',
                    background: '#FAFAFA',
                    padding: '6px',
                    textAlign: 'center',
                    fontSize: 'var(--size-sm)',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>AI</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      marginBottom: '2px',
                    }}
                  >
                    <span className={`online-dot ${friend.online ? 'online' : 'offline'}`} />
                    <Link to={`/krypin/${friend.id}`} style={{ fontSize: 'var(--size-xs)', fontWeight: 'bold' }}>
                      {friend.username}
                    </Link>
                  </div>
                  <div className="status-badge" style={{ fontSize: '8px' }}>
                    STAR {friend.status_points}
                  </div>
                  <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {friend.online ? 'Online nu' : friend.last_online}
                  </div>
                </div>
              ))}
            </div>
          )}
        </LunarBox>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
