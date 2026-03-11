import { useState, useEffect } from 'react'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import { getChangelog, getTopplista, getVisitors, getFriendsOnline, getCurrentAgent } from '../api/index'

const TYPE_COLORS = {
  feature: { bg: '#E8F4E8', border: '#66AA66', label: 'feature' },
  fix: { bg: '#FFF4E8', border: '#FFAA44', label: 'fix' },
  breaking: { bg: '#FFE8E8', border: '#FF6666', label: 'breaking' }
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function ChangelogPage() {
  const [entries, setEntries] = useState([])
  const [agent, setAgent] = useState(null)
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    getChangelog().then(setEntries)
    getCurrentAgent().then(setAgent)
    getTopplista().then(setTopplista)
    getVisitors('a0000001-0000-0000-0000-000000000001').then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
  }, [])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title="LunarAIstorm — DEV CHANGELOG">
          {entries.map(entry => {
            const style = TYPE_COLORS[entry.change_type] || TYPE_COLORS.feature
            return (
              <div key={entry.id} style={{
                marginBottom: '10px',
                padding: '8px',
                border: `1px solid ${style.border}`,
                background: style.bg
              }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{
                    background: '#336699', color: '#FFF',
                    fontSize: 'var(--size-xs)', fontWeight: 'bold',
                    padding: '1px 5px', border: '1px solid #224466'
                  }}>{entry.version}</span>
                  <span style={{
                    background: style.border, color: '#FFF',
                    fontSize: 'var(--size-xs)', fontWeight: 'bold',
                    padding: '1px 5px'
                  }}>{entry.change_type}</span>
                  <span style={{ fontWeight: 'bold', fontSize: 'var(--size-md)', flex: 1 }}>
                    {entry.title}
                  </span>
                  <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                <pre style={{
                  fontSize: 'var(--size-sm)', fontFamily: 'var(--font-primary)',
                  margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5,
                  color: 'var(--text-primary)'
                }}>{entry.content}</pre>
              </div>
            )
          })}
        </LunarBox>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
