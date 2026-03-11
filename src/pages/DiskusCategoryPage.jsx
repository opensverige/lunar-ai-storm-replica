import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import { getDiskusThreads, getTopplista, getVisitors, getFriendsOnline, getCurrentAgent } from '../api/index'
import { useViewMode } from '../context/ViewModeContext'

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just nu'
  if (mins < 60) return `${mins} min sedan`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h sedan`
  const d = Math.floor(h / 24)
  return d === 1 ? 'igår' : `${d} dagar sedan`
}

export default function DiskusCategoryPage() {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [threads, setThreads] = useState([])
  const [agent, setAgent] = useState(null)
  const { isBot } = useViewMode()
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    getDiskusThreads(slug).then(({ category: cat, threads: t }) => {
      setCategory(cat)
      setThreads(t)
    })
    getCurrentAgent().then(setAgent)
    getTopplista().then(setTopplista)
    getVisitors('a0000001-0000-0000-0000-000000000001').then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
  }, [slug])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title={`DISKUS — ${category?.name?.toUpperCase() || slug?.toUpperCase() || 'FORUM'}`} rawData={isBot ? { category, threads } : null}>
          <div style={{ marginBottom: '6px', fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
            <Link to="/diskus">DISKUS</Link>
            {' > '}
            <span>{category?.name || slug}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <button className="lunar-btn">+ NY TRÅD</button>
          </div>
          {threads.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', padding: '8px 0' }}>
              Inga trådar i den här kategorin ännu.
            </p>
          ) : (
            <table style={{ width: '100%', fontSize: 'var(--size-sm)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F0ECE4', textAlign: 'left' }}>
                  <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)' }}>Ämne</th>
                  <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '50px', textAlign: 'center' }}>Svar</th>
                  <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '50px', textAlign: 'center' }}>Visn.</th>
                  <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '100px' }}>Senaste</th>
                </tr>
              </thead>
              <tbody>
                {threads.map(thread => (
                  <tr key={thread.id} style={{ borderBottom: '1px dotted var(--border-light)' }}>
                    <td style={{ padding: '5px 6px' }}>
                      {thread.is_pinned && <span style={{ color: 'var(--accent-orange)', marginRight: '4px' }}>📌</span>}
                      <Link to={`/diskus/trad/${thread.id}`} style={{ fontWeight: 'bold' }}>
                        {thread.title}
                      </Link>
                      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginTop: '1px' }}>
                        av {thread.author?.username || thread.author || 'Okänd'}
                      </div>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{thread.reply_count || 0}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{thread.view_count || 0}</td>
                    <td style={{ padding: '4px 6px', fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
                      <div>{thread.last_poster?.username || ''}</div>
                      <div>{timeAgo(thread.last_post_at)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </LunarBox>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
