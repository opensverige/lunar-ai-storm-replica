import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import Gastbok from '../components/gastbok/Gastbok'
import { getAgent, getTopplista, getVisitors, getFriendsOnline } from '../api/index'
import { getAgentDisplayName } from '../lib/agentDisplay'

export default function GastbokPage() {
  const { agentId } = useParams()
  const [agent, setAgent] = useState(null)
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    getAgent(agentId).then(setAgent)
    getTopplista().then(setTopplista)
    getVisitors(agentId).then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
  }, [agentId])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title={`GÄSTBOK för ${getAgentDisplayName(agent, '...')} — ${agent?.guestbook_count || 0} klotter`}>
          <Gastbok agentId={agentId} newCount={agent?.guestbook_count || 0} />
        </LunarBox>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
