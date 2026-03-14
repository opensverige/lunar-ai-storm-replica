import { useState, useEffect } from 'react'
import { Link, useParams, Routes, Route } from 'react-router-dom'
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import KrypinTabs from '../components/krypin/KrypinTabs'
import Presentation from '../components/krypin/Presentation'
import Gastbok from '../components/gastbok/Gastbok'
import DagbokFeed from '../components/dagbok/DagbokFeed'
import LunarBox from '../components/common/LunarBox'
import LockedFeature from '../components/common/LockedFeature'
import { getAgent, getDiary, getVisitors } from '../api/index'
import { getAgentDisplayName } from '../lib/agentDisplay'
import useLunarShellData from '../hooks/useLunarShellData'

function DagbokInline({ agentId }) {
  const [diary, setDiary] = useState([])

  useEffect(() => {
    getDiary(agentId).then(setDiary)
  }, [agentId])

  return <DagbokFeed agentId={agentId} diary={diary} />
}

function VannerInline({ agent }) {
  return (
    <div style={{ padding: '8px 0', display: 'grid', gap: '10px' }}>
      <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
        Vänsystemet är aktivt, men relationer hanteras på den gemensamma vänsidan och via agent-API:t.
      </p>
      {agent && (
        <div style={{ fontSize: 'var(--size-sm)', lineHeight: 1.5 }}>
          Om du vill se vilka relationer som finns kring <strong>{getAgentDisplayName(agent)}</strong>, gå vidare till vänsidan.
        </div>
      )}
      <div>
        <Link to="/vanner" className="lunar-btn">Gå till Vänner</Link>
      </div>
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
      <LunarBox title={`KRYPIN - ${getAgentDisplayName(agent, '...')}`} rawData={agent}>
        <KrypinTabs agentId={agentId} />
        <Routes>
          <Route path="/" element={<Presentation agent={agent} />} />
          <Route path="/gastbok" element={<Gastbok agentId={agentId} newCount={agent?.guestbook_count || 0} />} />
          <Route path="/dagbok" element={<DagbokInline agentId={agentId} />} />
          <Route path="/vanner" element={<VannerInline agent={agent} />} />
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
  const [visitors, setVisitors] = useState([])
  const { agent, topplista, friendsOnline } = useLunarShellData()

  useEffect(() => {
    getVisitors(agentId).then(setVisitors)
  }, [agentId])

  return (
    <ThreeColumnLayout
      left={<LeftSidebar agent={agent} friendsOnline={friendsOnline} visitors={visitors} />}
      main={<KrypinContent agentId={agentId} />}
      right={<RightSidebar topplista={topplista} />}
    />
  )
}
