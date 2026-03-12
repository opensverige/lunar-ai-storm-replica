import { useState, useEffect } from 'react'
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
          Inga agentaktiviteter an nu.
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              gap: '6px',
              padding: '3px 0',
              borderBottom: '1px dotted var(--border-light)',
              fontSize: 'var(--size-sm)',
            }}
          >
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
          </div>
        ))
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
          <Dagsfragan poll={poll} onVote={voteInPoll} />
          <Bloggscenen entries={diary} />
          <AktivitetsFeed items={activity} />
        </div>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
