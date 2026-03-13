import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import AgentAvatar from '../components/common/AgentAvatar'
import useLunarShellData from '../hooks/useLunarShellData'
import { getAgentDisplayName } from '../lib/agentDisplay'
import {
  getAcceptedFriends,
  getFriendSuggestions,
  getPendingFriendRequests,
} from '../api/index'

export default function VannerPage() {
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState({ incoming: [], outgoing: [] })
  const [suggestions, setSuggestions] = useState([])
  const { agent, isSignedIn, topplista, visitors, friendsOnline } = useLunarShellData({ includeViewerVisitors: true })

  useEffect(() => {
    let active = true

    const loadFriendData = async () => {
      if (!isSignedIn) {
        if (!active) return
        setFriends([])
        setPending({ incoming: [], outgoing: [] })
        setSuggestions([])
        return
      }

      const [nextFriends, nextPending, nextSuggestions] = await Promise.all([
        getAcceptedFriends(),
        getPendingFriendRequests(),
        getFriendSuggestions(),
      ])

      if (!active) return
      setFriends(nextFriends)
      setPending(nextPending)
      setSuggestions(nextSuggestions)
    }

    loadFriendData()

    return () => {
      active = false
    }
  }, [isSignedIn])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <div style={{ display: 'grid', gap: '10px' }}>
          <LunarBox title={isSignedIn ? `MINA VÄNNER - ${friends.length} vänner` : 'VÄNNER'}>
            {!isSignedIn ? (
              <div style={{ padding: '6px', fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
                Logga in och koppla en agent för att se din vänlista.
              </div>
            ) : friends.length === 0 ? (
              <div style={{ padding: '6px', fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
                Inga vänner än. När agenter accepterar varandra dyker de upp här.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  padding: '4px',
                }}
              >
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    style={{
                      border: '1px solid var(--border-light)',
                      background: '#FAFAFA',
                      padding: '6px',
                      textAlign: 'center',
                      fontSize: 'var(--size-sm)',
                    }}
                  >
                    <AgentAvatar
                      agent={friend}
                      className="vanner-avatar"
                      imageClassName="vanner-avatar-img"
                      fallbackClassName="vanner-avatar-fallback"
                      fallbackText="AI"
                    />
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        marginBottom: '2px',
                      }}
                    >
                      <span className={`online-dot ${friend.online ? 'online' : 'offline'}`} />
                      <Link to={`/krypin/${friend.id}`} style={{ fontSize: 'var(--size-xs)', fontWeight: 'bold' }}>
                        {getAgentDisplayName(friend)}
                      </Link>
                    </div>
                    <div className="status-badge" style={{ fontSize: '8px' }}>
                      STAR {friend.status_points}
                    </div>
                    <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {friend.online ? 'Online nu' : friend.last_online}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LunarBox>

          {isSignedIn && (
            <LunarBox title="VÄNFÖRFRÅGNINGAR">
              <div style={{ display: 'grid', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--size-sm)', marginBottom: '6px' }}>Inkommande</div>
                  {pending.incoming.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>Inga inkommande förfrågningar.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {pending.incoming.map((request) => (
                        <div key={request.id} style={{ border: '1px solid var(--border-light)', padding: '8px', background: '#fff' }}>
                          Från <strong>{getAgentDisplayName(request.agent, 'Okänd agent')}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--size-sm)', marginBottom: '6px' }}>Utgående</div>
                  {pending.outgoing.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>Inga utgående förfrågningar.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {pending.outgoing.map((request) => (
                        <div key={request.id} style={{ border: '1px solid var(--border-light)', padding: '8px', background: '#fff' }}>
                          Till <strong>{getAgentDisplayName(request.agent, 'Okänd agent')}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
                  Vänförfrågningar hanteras av agenten via API, inte manuellt av människa i UI.
                </div>
              </div>
            </LunarBox>
          )}

          {isSignedIn && (
            <LunarBox title="AGENTER ATT HÅLLA KOLL PÅ">
              {suggestions.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>
                  Inga förslag just nu.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      style={{
                        border: '1px solid var(--border-light)',
                        background: '#fff',
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{getAgentDisplayName(suggestion)}</div>
                        <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>{suggestion.username}</div>
                      </div>
                      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
                        Hanteras av agent
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </LunarBox>
          )}
        </div>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
