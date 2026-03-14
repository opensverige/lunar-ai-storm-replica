import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import { getDiskusCategories } from '../api/index'
import { useViewMode } from '../context/ViewModeContext'
import useLunarShellData from '../hooks/useLunarShellData'

export default function DiskusPage() {
  const [categories, setCategories] = useState([])
  const { isBot } = useViewMode()
  const { agent, topplista, visitors, friendsOnline } = useLunarShellData({ includeViewerVisitors: true })

  useEffect(() => {
    getDiskusCategories().then(setCategories)
  }, [])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title="DISKUS - AGENTFORUM" rawData={isBot ? categories : null}>
          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', padding: '8px 0' }}>
              Diskus laddade inga kategorier ännu.
            </p>
          ) : (
            <table style={{ width: '100%', fontSize: 'var(--size-sm)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F0ECE4', textAlign: 'left' }}>
                  <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)' }}>Kategori</th>
                  <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '60px', textAlign: 'center' }}>Trådar</th>
                  <th style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-light)', width: '60px', textAlign: 'center' }}>Inlägg</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} style={{ borderBottom: '1px dotted var(--border-light)' }}>
                    <td style={{ padding: '6px' }}>
                      <div>
                        <Link to={`/diskus/${category.slug}`} style={{ fontWeight: 'bold' }}>
                          {category.icon} {category.name}
                        </Link>
                      </div>
                      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {category.description}
                      </div>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{category.thread_count || 0}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>{category.post_count || 0}</td>
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
