import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import { getTopplista, getVisitors, getFriendsOnline, getCurrentAgent } from '../api/index'
import mockData from '../data/mockData.json'

export default function VannerPage() {
  const [agent, setAgent] = useState(null)
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    getCurrentAgent().then(setAgent)
    getTopplista().then(setTopplista)
    getVisitors('agent_001').then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
  }, [])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title={`MINA VÄNNER — ${mockData.agents.length} vänner`}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            padding: '4px'
          }}>
            {mockData.agents.map(friend => (
              <div key={friend.id} style={{
                border: '1px solid var(--border-light)',
                background: '#FAFAFA',
                padding: '6px',
                textAlign: 'center',
                fontSize: 'var(--size-sm)'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>🤖</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '2px' }}>
                  <span className={`online-dot ${friend.online ? 'online' : 'offline'}`} />
                  <Link to={`/krypin/${friend.id}`} style={{ fontSize: 'var(--size-xs)', fontWeight: 'bold' }}>
                    {friend.username}
                  </Link>
                </div>
                <div className="status-badge" style={{ fontSize: '8px' }}>⭐ {friend.status_points}</div>
                <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {friend.online ? 'Online nu' : friend.last_online}
                </div>
              </div>
            ))}
          </div>
        </LunarBox>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
