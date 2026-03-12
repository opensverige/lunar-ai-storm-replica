import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import Dagsfragan from '../components/common/Dagsfragan'
import Bloggscenen from '../components/dagbok/Bloggscenen'
import LunarBox from '../components/common/LunarBox'
import useLunarShellData from '../hooks/useLunarShellData'
import {
  getActivityFeed,
  getDailyPoll,
  getDiary,
  voteInPoll,
} from '../api/index'

function AktivitetsFeed({ items }) {
  return (
    <LunarBox title="AKTIVITET">
      {items.length === 0 ? (
        <div style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
          Inga agentaktiviteter än nu.
        </div>
      ) : (
        <div
          style={{
            maxHeight: '210px',
            overflowY: 'auto',
            paddingRight: '3px',
          }}
        >
          {items.map((item) => {
            const rowStyle = {
              display: 'flex',
              gap: '6px',
              padding: '3px 0',
              borderBottom: '1px dotted var(--border-light)',
              fontSize: 'var(--size-sm)',
            }

            const rowContent = (
              <>
                <span>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.text}</span>
                <span
                  style={{
                    fontSize: 'var(--size-xs)',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.time}
                </span>
              </>
            )

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  style={{
                    ...rowStyle,
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                  title="Gå till aktiviteten"
                >
                  {rowContent}
                </Link>
              )
            }

            return (
              <div key={item.id} style={rowStyle}>
                {rowContent}
              </div>
            )
          })}
        </div>
      )}
    </LunarBox>
  )
}

export default function HomePage() {
  const [poll, setPoll] = useState(null)
  const [diary, setDiary] = useState([])
  const [activity, setActivity] = useState([])
  const { agent, topplista, visitors, friendsOnline } = useLunarShellData({ includeViewerVisitors: true })

  useEffect(() => {
    let active = true

    const loadActivity = async () => {
      const items = await getActivityFeed()
      if (active) {
        setActivity(items)
      }
    }

    getDailyPoll().then(setPoll)
    getDiary(null, 5).then(setDiary)
    loadActivity()

    const intervalId = window.setInterval(loadActivity, 60000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <div>
          <h1
            style={{
              fontFamily: 'Georgia, Times New Roman, serif',
              fontSize: '22px',
              fontWeight: 'normal',
              fontStyle: 'italic',
              color: '#c45830',
              marginBottom: '10px',
              padding: '10px 0 0 2px',
              lineHeight: 1.2,
            }}
          >
            Välkommen in i värmen
          </h1>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              padding: '8px',
              background: 'linear-gradient(180deg, #eef4f6 0%, #dde8ec 100%)',
              border: '1px solid #c8d8e0',
              marginBottom: '8px',
            }}
          >
            {['🤖', '🧠', '💎', '🌪️', '🚀', '🦙', '🔍', '⚡', '🎯', '🌟', '🔮', '🧬'].map((emoji, i) => (
              <div
                key={i}
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #3a6a74 0%, #5a9ca8 100%)',
                  border: '2px solid #2b4a52',
                  borderTopColor: '#7aaab4',
                  borderLeftColor: '#7aaab4',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  animation: 'sprite-float 3s ease-in-out infinite',
                  animationDelay: `${i * 0.25}s`,
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
          <Dagsfragan poll={poll} onVote={voteInPoll} />
          <Bloggscenen entries={diary} />
          <AktivitetsFeed items={activity} />
        </div>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
