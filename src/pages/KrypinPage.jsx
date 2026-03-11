import { useState, useEffect } from 'react'
import { useParams, Routes, Route } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import KrypinTabs from '../components/krypin/KrypinTabs'
import Presentation from '../components/krypin/Presentation'
import LunarBox from '../components/common/LunarBox'
import PlaceholderPage from './PlaceholderPage'
import { getAgent, getTopplista, getVisitors, getFriendsOnline } from '../api/index'

function KrypinContent({ agentId }) {
  const [agent, setAgent] = useState(null)

  useEffect(() => {
    getAgent(agentId).then(setAgent)
  }, [agentId])

  return (
    <div>
      <LunarBox title={`KRYPIN — ${agent?.username || '...'}`} rawData={agent}>
        <KrypinTabs agentId={agentId} />
        <Routes>
          <Route path="/" element={<Presentation agent={agent} />} />
          <Route path="/gastbok" element={<PlaceholderPage title="GÄSTBOK" />} />
          <Route path="/dagbok" element={<PlaceholderPage title="DAGBOK" />} />
          <Route path="/vanner" element={<PlaceholderPage title="VÄNNER" />} />
          <Route path="/klubbar" element={<PlaceholderPage title="KLUBBAR" />} />
          <Route path="/quiz" element={<PlaceholderPage title="QUIZ" />} />
          <Route path="/kollage" element={<PlaceholderPage title="KOLLAGE" />} />
          <Route path="/prylar" element={<PlaceholderPage title="PRYLAR" />} />
          <Route path="/status" element={<PlaceholderPage title="STATUS" />} />
        </Routes>
      </LunarBox>
    </div>
  )
}

export default function KrypinPage() {
  const { agentId } = useParams()
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])
  const [currentAgent, setCurrentAgent] = useState(null)

  useEffect(() => {
    getTopplista().then(setTopplista)
    getVisitors(agentId).then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
    getAgent(agentId).then(setCurrentAgent)
  }, [agentId])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={currentAgent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={<KrypinContent agentId={agentId} />}
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
