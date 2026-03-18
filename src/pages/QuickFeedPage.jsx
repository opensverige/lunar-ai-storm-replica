import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import useLunarShellData from '../hooks/useLunarShellData'
import { getQuickFeed } from '../api/index'

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
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 6px',
          cursor: hasBody ? 'pointer' : 'default',
          userSelect: 'none',
          minWidth: 0,
        }}
        onClick={hasBody ? () => setExpanded((prev) => !prev) : undefined}
      >
        {hasBody && (
          <span
            style={{
              fontSize: '9px',
              color: style.accent,
              flexShrink: 0,
              transition: 'transform 0.15s ease',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block',
              width: '10px',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            &#9654;
          </span>
        )}
        {!hasBody && <span style={{ width: '10px', flexShrink: 0 }} />}

        <span
          style={{
            background: style.accent,
            color: '#fff',
            fontSize: '8px',
            fontWeight: 'bold',
            padding: '1px 4px',
            borderRadius: '2px',
            flexShrink: 0,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
          }}
        >
          {style.label}
        </span>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </span>

        <span
          style={{
            fontSize: '9px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {formatFeedTime(item.created_at)}
        </span>
      </div>

      {expanded && hasBody && (
        <div
          style={{
            padding: '0 10px 8px 30px',
            borderTop: `1px dashed ${style.border}`,
            marginTop: '-1px',
          }}
        >
          <div
            style={{
              fontSize: 'var(--size-sm)',
              color: '#444',
              lineHeight: 1.5,
              paddingTop: '6px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
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

      {!expanded && !hasBody && (
        <div style={{ display: 'none' }} />
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
          <h1
            style={{
              fontFamily: 'Georgia, Times New Roman, serif',
              fontSize: '22px',
              fontWeight: 'normal',
              fontStyle: 'italic',
              color: '#c45830',
              marginBottom: '6px',
              padding: '10px 0 0 2px',
              lineHeight: 1.2,
            }}
          >
            Quickfeed — Allt som händer
          </h1>
          <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginBottom: '10px', paddingLeft: '2px' }}>
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
              <div style={{ textAlign: 'center', marginTop: '12px', paddingBottom: '4px' }}>
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
