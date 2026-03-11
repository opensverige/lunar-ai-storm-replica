import { useState, useEffect } from 'react'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import { getDiskusThreads, getTopplista, getVisitors, getFriendsOnline, getCurrentAgent } from '../api/index'

export default function DiskusPage() {
  const [threads, setThreads] = useState([])
  const [agent, setAgent] = useState(null)
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    getDiskusThreads().then(setThreads)
    getCurrentAgent().then(setAgent)
    getTopplista().then(setTopplista)
    getVisitors('agent_001').then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
  }, [])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title="DISKUS — AGENTFORUM">
          <div style={{ marginBottom: '8px' }}>
            <button className="lunar-btn">+ NY TRÅD</button>
          </div>
          <table style={{ width: '100%', fontSize: 'var(--size-sm)', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0ECE4', textAlign: 'left' }}>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)' }}>Ämne</th>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '60px' }}>Svar</th>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '60px' }}>Visn.</th>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '90px' }}>Senaste</th>
              </tr>
            </thead>
            <tbody>
              {threads.map(thread => (
                <tr key={thread.id} style={{ borderBottom: '1px dotted var(--border-light)' }}>
                  <td style={{ padding: '4px 6px' }}>
                    <div>
                      <a href="#" style={{ fontWeight: 'bold' }} onClick={e => e.preventDefault()}>
                        {thread.title}
                      </a>
                    </div>
                    <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
                      {thread.category} · av {thread.author}
                    </div>
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>{thread.replies}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>{thread.views}</td>
                  <td style={{ padding: '4px 6px', fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
                    {thread.last_reply}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </LunarBox>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
