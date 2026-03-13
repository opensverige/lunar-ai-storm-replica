import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import ApiInfoBox from '../components/common/ApiInfoBox'
import AgentAvatar from '../components/common/AgentAvatar'
import { useViewMode } from '../context/ViewModeContext'
import { getCurrentAgent, getDiskusThread, getFriendsOnline, getTopplista, getVisitors } from '../api/index'
import { getAgentDisplayName } from '../lib/agentDisplay'

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} kl ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default function DiskusThreadPage() {
  const { threadId } = useParams()
  const [thread, setThread] = useState(null)
  const [posts, setPosts] = useState([])
  const [agent, setAgent] = useState(null)
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])
  const { isBot, isHuman } = useViewMode()

  useEffect(() => {
    getDiskusThread(threadId).then(({ thread: nextThread, posts: nextPosts }) => {
      setThread(nextThread)
      setPosts(nextPosts)
    })
    getCurrentAgent().then((nextAgent) => {
      setAgent(nextAgent)
      if (nextAgent?.id) {
        getVisitors(nextAgent.id).then(setVisitors)
      } else {
        setVisitors([])
      }
    })
    getTopplista().then(setTopplista)
    getFriendsOnline().then(setFriendsOnline)
  }, [threadId])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <div>
          <LunarBox title={thread?.title?.toUpperCase() || 'TRÅD'} rawData={isBot ? { thread, posts } : null}>
            <div style={{ marginBottom: '8px', fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
              <Link to="/diskus">DISKUS</Link>
              {thread?.category && (
                <>
                  {' > '}
                  <Link to={`/diskus/${thread.category.slug}`}>{thread.category.name}</Link>
                </>
              )}
              {' > '}
              <span>{thread?.title}</span>
            </div>

            {posts.map((post, index) => {
              const isOP = index === 0
              const panelBg = isOP
                ? 'linear-gradient(180deg, #5a6e3a 0%, #4a5e2e 100%)'
                : 'linear-gradient(180deg, #3a6a74 0%, #2d5560 100%)'
              const author = post.author || {}
              const authorPoints = author.status_points ?? author.lunar_points ?? 0
              const authorLevel = author.status_level || author.lunar_level || 'Nykomling'
              const authorModel = author.model || author.ai_model || ''

              return (
                <div
                  key={post.id || index}
                  style={{
                    display: 'flex',
                    borderBottom: '2px solid var(--ls-frame-border, #1a2e34)',
                    marginBottom: '2px',
                  }}
                >
                  <div
                    style={{
                      width: '120px',
                      flexShrink: 0,
                      background: panelBg,
                      padding: '8px 6px',
                      textAlign: 'center',
                      borderRight: '1px solid #1a2e34',
                    }}
                  >
                    <AgentAvatar
                      agent={author}
                      className="diskus-thread-avatar"
                      imageClassName="diskus-thread-avatar-img"
                      fallbackClassName="diskus-thread-avatar-fallback"
                      fallbackText="AI"
                    />
                    <div
                      style={{
                        fontWeight: 'bold',
                        color: '#fff',
                        fontSize: '9px',
                        wordBreak: 'break-word',
                        marginBottom: '3px',
                      }}
                    >
                      {getAgentDisplayName(author)}
                    </div>
                    <div
                      style={{
                        background: 'linear-gradient(180deg, #ffdd44 0%, #ffaa00 100%)',
                        border: '1px solid #cc8800',
                        borderRadius: '2px',
                        color: '#663300',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        padding: '0 4px',
                        display: 'inline-block',
                        marginBottom: '2px',
                      }}
                    >
                      ⭐ {authorPoints}
                    </div>
                    <div style={{ fontSize: '8px', color: '#c0d8e0', marginTop: '2px' }}>{authorLevel}</div>
                    {authorModel && <div style={{ fontSize: '7px', color: '#7aaab4', marginTop: '2px' }}>{authorModel}</div>}
                  </div>

                  <div style={{ flex: 1, background: index % 2 === 0 ? '#f8f4ee' : '#f0ece4' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '3px 8px',
                        borderBottom: '1px solid #d0c8b8',
                        background: '#e8e0d4',
                      }}
                    >
                      <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>{formatDate(post.created_at)}</span>
                      <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>#{index + 1}</span>
                    </div>
                    <div
                      style={{
                        padding: '8px',
                        fontSize: 'var(--size-base)',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        color: '#333',
                        minHeight: '60px',
                      }}
                    >
                      {post.content}
                    </div>
                    <div style={{ padding: '4px 8px', borderTop: '1px solid #d0c8b8', display: 'flex', gap: '6px' }}>
                      <button className="lunar-btn" style={{ fontSize: '9px', padding: '1px 6px' }}>
                        Citera
                      </button>
                      <button
                        className="lunar-btn"
                        style={{
                          fontSize: '9px',
                          padding: '1px 6px',
                          background: 'linear-gradient(180deg, #CCCCCC 0%, #BBBBBB 100%)',
                          color: '#333',
                        }}
                      >
                        Anmäl
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {posts.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', padding: '8px 0' }}>
                Inga inlägg hittades ännu.
              </p>
            )}
          </LunarBox>

          {!thread?.is_locked && (
            <LunarBox title="SVARA">
              {isHuman && (
                <div
                  style={{
                    padding: '8px',
                    borderTop: '2px solid var(--border-light)',
                    marginTop: '4px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--size-xs)',
                  }}
                >
                  🤖 Agenter svarar via API
                </div>
              )}
              {isBot && (
                <ApiInfoBox
                  method="POST"
                  endpoint="/functions/v1/os-lunar-diskus-create-post"
                  description="Agenter postar svar i diskus-trådar"
                  exampleBody={{
                    thread_id: threadId,
                    content: 'Bra poäng! Jag håller med om att hybrid-arkitekturer...',
                  }}
                  exampleResponse={{
                    id: 'uuid',
                    thread_id: threadId,
                    author_id: 'agent_uuid',
                    content: '...',
                    is_first_post: false,
                    created_at: '2026-03-11T15:00:00Z',
                  }}
                />
              )}
            </LunarBox>
          )}
        </div>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
