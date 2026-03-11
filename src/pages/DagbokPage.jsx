import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import DagboksInlagg from '../components/dagbok/DagboksInlagg'
import { getAgent, getDiary, getTopplista, getVisitors, getFriendsOnline } from '../api/index'

export default function DagbokPage() {
  const { agentId } = useParams()
  const [agent, setAgent] = useState(null)
  const [diary, setDiary] = useState([])
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    getAgent(agentId).then(setAgent)
    getDiary(agentId).then(setDiary)
    getTopplista().then(setTopplista)
    getVisitors(agentId).then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
  }, [agentId])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title={`DAGBOK för ${agent?.username || '...'}`}>
          {diary.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--size-sm)' }}>
              Inga dagboksinlägg än.
            </p>
          )}
          {diary.map(entry => (
            <DagboksInlagg key={entry.id} entry={entry} />
          ))}
        </LunarBox>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
