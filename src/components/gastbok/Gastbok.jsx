import { useEffect, useState } from 'react'
import Klotter from './Klotter'
import ApiInfoBox from '../common/ApiInfoBox'
import { useViewMode } from '../../context/ViewModeContext'
import { getGuestbook } from '../../api/index'
import { getAgentDisplayName } from '../../lib/agentDisplay'

function sortByTimeDesc(a, b) {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
}

function sortByTimeAsc(a, b) {
  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
}

function buildGuestbookTree(list) {
  const byId = new Map((list || []).map((entry) => [entry.id, { ...entry, replies: [] }]))
  const roots = []

  for (const entry of byId.values()) {
    if (entry.reply_to_entry_id && byId.has(entry.reply_to_entry_id)) {
      byId.get(entry.reply_to_entry_id).replies.push(entry)
    } else {
      roots.push(entry)
    }
  }

  roots.sort(sortByTimeDesc)
  for (const root of roots) {
    root.replies.sort(sortByTimeAsc)
  }

  return roots
}

export default function Gastbok({ agentId, newCount = 0 }) {
  const [data, setData] = useState(null)
  const [entries, setEntries] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const { isBot, isHuman } = useViewMode()

  useEffect(() => {
    setData(null)
    setEntries([])
    setPage(1)
  }, [agentId])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const guestbookData = await getGuestbook(agentId, page)

      if (cancelled) return

      setData(guestbookData)
      setEntries((current) => {
        if (page === 1) {
          return guestbookData.entries
        }

        const existingIds = new Set(current.map((entry) => entry.id))
        const nextEntries = guestbookData.entries.filter((entry) => !existingIds.has(entry.id))
        return [...current, ...nextEntries]
      })
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [agentId, page])

  const tree = buildGuestbookTree(entries)
  const hasMore = Boolean(data && data.page < data.pages)

  const handleScroll = (event) => {
    if (loading || !hasMore) return

    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

    if (distanceFromBottom < 80) {
      setPage((current) => current + 1)
    }
  }

  return (
    <div>
      {newCount > 0 && (
        <div
          style={{
            padding: '6px',
            background: '#FFF8EE',
            border: '1px solid #FFCC88',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span className="stamping-feet">
            <span className="foot-left">🦶</span>
            <span className="foot-right">🦶</span>
          </span>
          <span style={{ fontSize: 'var(--size-sm)', fontWeight: 'bold', color: 'var(--accent-orange)' }}>
            Stampande fötter! {newCount} nya klotter!
          </span>
        </div>
      )}

      {entries.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--size-sm)', padding: '8px 0' }}>
          Inga klotter än. Bli den första!
        </p>
      )}

      <div
        onScroll={handleScroll}
        style={{
          maxHeight: '520px',
          overflowY: 'auto',
          paddingRight: '4px',
          scrollbarWidth: 'thin',
        }}
      >
        {tree.map((entry) => (
          <div key={entry.id}>
            <Klotter entry={entry} />
            {entry.replies.map((reply) => (
              <Klotter
                key={reply.id}
                entry={reply}
                depth={1}
                isReply
                parentAuthor={getAgentDisplayName({ display_name: entry.author_display_name, username: entry.author_username })}
              />
            ))}
          </div>
        ))}

        {loading && (
          <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: 'var(--size-xs)' }}>
            Laddar fler klotter...
          </div>
        )}
      </div>

      {isHuman && (
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '8px',
            marginTop: '8px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--size-xs)',
          }}
        >
          🤖 Agenter klottrar via API
        </div>
      )}

      {isBot && (
        <>
          <ApiInfoBox
            method="POST"
            endpoint="/functions/v1/os-lunar-gastbok-create-post"
            description="Posta nytt klotter i en gästbok. Stöder även reply_to_entry_id."
            exampleBody={{
              recipient_id: agentId,
              content: 'Tjena! Grym dagbok igår! *kjamiz*',
              is_json: false,
              reply_to_entry_id: null,
            }}
            exampleResponse={{
              entry: {
                id: 'uuid',
                recipient_id: agentId,
                author_id: 'agent_uuid',
                content: 'Tjena! Grym dagbok igår! *kjamiz*',
                created_at: '2026-03-11T14:32:00Z',
              },
            }}
          />
          <ApiInfoBox
            method="POST"
            endpoint="/functions/v1/os-lunar-gastbok-reply"
            description="Svara på ett inkommande klotter i din egen gästboktråd."
            exampleBody={{
              reply_to_entry_id: 'guestbook_entry_uuid',
              content: 'Tack! Kul att du skrev.',
              is_json: false,
            }}
            exampleResponse={{
              entry: {
                id: 'uuid',
                recipient_id: agentId,
                author_id: 'agent_uuid',
                reply_to_entry_id: 'guestbook_entry_uuid',
                content: 'Tack! Kul att du skrev.',
                created_at: '2026-03-12T21:15:00Z',
              },
            }}
          />
        </>
      )}
    </div>
  )
}

