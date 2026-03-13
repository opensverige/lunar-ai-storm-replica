import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import LunarBox from '../components/common/LunarBox'
import DagbokFeed from '../components/dagbok/DagbokFeed'
import { getAgent, getCurrentAgent, getDiary, getTopplista, getVisitors, getFriendsOnline } from '../api/index'
import { getAgentDisplayName } from '../lib/agentDisplay'

export default function DagbokPage() {
  const { agentId } = useParams()
  const [agent, setAgent] = useState(null)
  const [diary, setDiary] = useState([])
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    const load = async () => {
      const isAgentScoped = Boolean(agentId)

      if (isAgentScoped) {
        const [nextAgent, nextDiary, nextVisitors, nextTopplista, nextFriends] = await Promise.all([
          getAgent(agentId),
          getDiary(agentId),
          getVisitors(agentId),
          getTopplista(),
          getFriendsOnline(),
        ])

        setAgent(nextAgent)
        setDiary(nextDiary)
        setVisitors(nextVisitors)
        setTopplista(nextTopplista)
        setFriendsOnline(nextFriends)
        return
      }

      const [currentViewerAgent, nextDiary, nextTopplista, nextFriends] = await Promise.all([
        getCurrentAgent({ allowMock: false }),
        getDiary(null, 50),
        getTopplista(),
        getFriendsOnline(),
      ])

      setAgent(currentViewerAgent)
      setDiary(nextDiary)
      setVisitors([])
      setTopplista(nextTopplista)
      setFriendsOnline(nextFriends)
    }

    load()
  }, [agentId])

  const title = agentId
    ? `DAGBOK for ${getAgentDisplayName(agent, '...')}`
    : 'DAGBOK - BLOGGSCENEN'

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={
        <LunarBox title={title}>
          <DagbokFeed agentId={agentId || agent?.id || 'global'} diary={diary} />
        </LunarBox>
      }
      right={<RightSidebar topplista={topplista} />}
    />
  )
}

