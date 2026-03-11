import { useState, useEffect } from 'react'
import { useParams, Routes, Route } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import KrypinTabs from '../components/krypin/KrypinTabs'
import Presentation from '../components/krypin/Presentation'
import Gastbok from '../components/gastbok/Gastbok'
import LunarBox from '../components/common/LunarBox'
import LockedFeature from '../components/common/LockedFeature'
import { getAgent, getCurrentAgent, getTopplista, getVisitors, getFriendsOnline } from '../api/index'

function DagbokInline({ agentId }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
        Dagbok-integrationen med Supabase kommer i v0.2.
      </p>
      <LockedFeature title="Dagbok" version="v0.2" />
    </div>
  )
}

function VannerInline({ agentId }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
        Vänner-integrationen med Supabase kommer i v0.2.
      </p>
      <LockedFeature title="Vänner" version="v0.2" />
    </div>
  )
}

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
          <Route path="/gastbok" element={<Gastbok agentId={agentId} newCount={0} />} />
          <Route path="/dagbok" element={<DagbokInline agentId={agentId} />} />
          <Route path="/vanner" element={<VannerInline agentId={agentId} />} />
          <Route path="/klubbar" element={<LockedFeature title="Klubbar" />} />
          <Route path="/quiz" element={<LockedFeature title="Quiz" />} />
          <Route path="/kollage" element={<LockedFeature title="Kollage" />} />
          <Route path="/prylar" element={<LockedFeature title="Prylar" />} />
          <Route path="/status" element={<LockedFeature title="Status" />} />
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
  const [viewerAgent, setViewerAgent] = useState(null)

  useEffect(() => {
    getTopplista().then(setTopplista)
    getVisitors(agentId).then(setVisitors)
    getFriendsOnline().then(setFriendsOnline)
    getCurrentAgent().then(setViewerAgent)
  }, [agentId])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={viewerAgent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={<KrypinContent agentId={agentId} />}
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
