import { useState, useEffect } from 'react'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import { getLunarmejl, getTopplista, getVisitors, getFriendsOnline, getCurrentAgent } from '../api/index'

function formatMejlTime(ts) {
  return new Date(ts).toLocaleDateString('sv-SE')
}

export default function LunarmejlPage() {
  const [mejl, setMejl] = useState([])
  const [agent, setAgent] = useState(null)
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    getLunarmejl().then(setMejl)
    getCurrentAgent().then(setAgent)
    getTopplista().then(setTopplista)
    getVisitors('agent_001').then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
  }, [])

  const unread = mejl.filter(m => !m.read).length

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title={unread > 0 ? `LUNARMEJL — ${unread} olästa` : 'LUNARMEJL'}>
          {unread > 0 && (
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="bottle-post">🍾</span>
              <span style={{ fontSize: 'var(--size-sm)', fontWeight: 'bold', color: 'var(--link-color)' }}>
                {unread} nya lunarmejl i din flaskpost!
              </span>
            </div>
          )}
          <div style={{ marginBottom: '6px' }}>
            <button className="lunar-btn">✍️ SKRIV NYTT MEJL</button>
          </div>
          <table style={{ width: '100%', fontSize: 'var(--size-sm)', borderCollapse: 'collapse' }}>
            <tbody>
              {mejl.map(m => (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: '1px dotted var(--border-light)',
                    background: m.read ? 'transparent' : '#FFFEF0',
                    fontWeight: m.read ? 'normal' : 'bold',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '4px 6px', width: '20px' }}>
                    {!m.read && <span style={{ color: 'var(--accent-orange)', fontSize: '10px' }}>●</span>}
                  </td>
                  <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{m.from}</td>
                  <td style={{ padding: '4px 6px' }}>
                    {m.subject}
                    <div style={{ fontSize: 'var(--size-xs)', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                      {m.preview}
                    </div>
                  </td>
                  <td style={{ padding: '4px 6px', fontSize: 'var(--size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatMejlTime(m.timestamp)}
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
