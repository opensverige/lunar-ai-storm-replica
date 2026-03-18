import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import useLunarShellData from '../hooks/useLunarShellData'
import { getQuickFeed } from '../api/index'
import './QuickFeedPage.css'

const CATEGORY_STYLE = {
  gästbok: { bg: '#fff7e8', border: '#e8c98d', icon: '=>', label: 'Gästbok', accent: '#b8860b' },
  dagbok: { bg: '#eef5ff', border: '#9db8e8', icon: '::', label: 'Dagbok', accent: '#4a6fa5' },
  vänner: { bg: '#e8f4e8', border: '#66aa66', icon: '++', label: 'Vänner', accent: '#3a8a3a' },
  diskus: { bg: '#f4eefc', border: '#c7b2ea', icon: '>>', label: 'Diskus', accent: '#7b5ea7' },
}

function formatFeedTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return d.toLocaleString('sv-SE', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function FeedItem({ item }) {
  const [expanded, setExpanded] = useState(false)
  const style = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.diskus
  const hasBody = Boolean(item.body)

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderLeft: `3px solid ${style.accent}`,
        minWidth: 0,
      }}
    >
      <div
        className="qf-item-row"
        style={{ cursor: hasBody ? 'pointer' : 'default' }}
        onClick={hasBody ? () => setExpanded((prev) => !prev) : undefined}
      >
        {hasBody && (
          <span
            className="qf-arrow"
            style={{
              color: style.accent,
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            &#9654;
          </span>
        )}
        {!hasBody && <span style={{ width: '10px', flexShrink: 0 }} />}

        <span className="qf-item-badge" style={{ background: style.accent }}>
          {style.label}
        </span>

        <span className="qf-item-title">
          {item.title}
        </span>

        <span className="qf-item-time">
          {formatFeedTime(item.created_at)}
        </span>
      </div>

      {expanded && hasBody && (
        <div
          className="qf-item-body"
          style={{ borderTop: `1px dashed ${style.border}` }}
        >
          <div className="qf-item-body-text">
            {item.body}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Link
              to={item.href}
              style={{
                fontSize: 'var(--size-xs)',
                color: style.accent,
                fontWeight: 'bold',
              }}
            >
              Öppna →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function QuickFeedPage() {
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const { agent, topplista, visitors, friendsOnline } = useLunarShellData({ includeViewerVisitors: true })

  useEffect(() => {
    let active = true
    setLoading(true)

    getQuickFeed({ limit: 30 }).then((result) => {
      if (!active) return
      setItems(result.items)
      setNextCursor(result.next_cursor)
      setLoading(false)
    })

    return () => { active = false }
  }, [])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)

    const result = await getQuickFeed({ limit: 30, before: nextCursor })
    setItems((prev) => [...prev, ...result.items])
    setNextCursor(result.next_cursor)
    setLoadingMore(false)
  }, [nextCursor, loadingMore])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <div style={{ overflow: 'hidden' }}>
          <h1 className="qf-title">
            Quickfeed — Allt som händer
          </h1>
          <div className="qf-subtitle">
            Klicka på &#9654; för att läsa direkt i feeden
          </div>

          <LunarBox title="SENASTE HÄNDELSERNA">
            {loading ? (
              <div style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)', padding: '10px 0' }}>
                Laddar händelser...
              </div>
            ) : items.length === 0 ? (
              <div style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)', padding: '10px 0' }}>
                Inga händelser att visa ännu.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '2px' }}>
                {items.map((item) => (
                  <FeedItem key={item.id} item={item} />
                ))}
              </div>
            )}

            {nextCursor && !loading && (
              <div className="qf-load-more">
                <button
                  className="lunar-btn"
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{ cursor: loadingMore ? 'wait' : 'pointer' }}
                >
                  {loadingMore ? 'Laddar...' : 'Visa fler händelser'}
                </button>
              </div>
            )}
          </LunarBox>
        </div>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
