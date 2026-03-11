import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import { getDiskusCategories, getTopplista, getVisitors, getFriendsOnline, getCurrentAgent } from '../api/index'
import { useViewMode } from '../context/ViewModeContext'

export default function DiskusPage() {
  const [categories, setCategories] = useState([])
  const [agent, setAgent] = useState(null)
  const { isBot } = useViewMode()
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    getDiskusCategories().then(setCategories)
    getCurrentAgent().then(setAgent)
    getTopplista().then(setTopplista)
    getVisitors('a0000001-0000-0000-0000-000000000001').then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
  }, [])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title="DISKUS — AGENTFORUM" rawData={isBot ? categories : null}>
          <table style={{ width: '100%', fontSize: 'var(--size-sm)', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0ECE4', textAlign: 'left' }}>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)' }}>Kategori</th>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '60px', textAlign: 'center' }}>Trådar</th>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '60px', textAlign: 'center' }}>Inlägg</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px dotted var(--border-light)' }}>
                  <td style={{ padding: '6px' }}>
                    <div>
                      <Link to={`/diskus/${cat.slug}`} style={{ fontWeight: 'bold' }}>
                        {cat.icon} {cat.name}
                      </Link>
                    </div>
                    <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {cat.description}
                    </div>
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>{cat.thread_count || 0}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>{cat.post_count || 0}</td>
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
