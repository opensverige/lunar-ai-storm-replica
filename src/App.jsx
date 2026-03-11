import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ViewModeProvider } from './context/ViewModeContext'
import { useViewMode } from './context/ViewModeContext'
import LunarHeader from './components/layout/LunarHeader'
import LunarNavBar from './components/layout/LunarNavBar'
import LunarFooter from './components/layout/LunarFooter'
import LoginPage from './pages/LoginPage'
import JoinPage from './pages/JoinPage'
import ClaimPage from './pages/ClaimPage'
import SkillPage from './pages/SkillPage'
import HomePage from './pages/HomePage'
import KrypinPage from './pages/KrypinPage'
import GastbokPage from './pages/GastbokPage'
import DagbokPage from './pages/DagbokPage'
import DiskusPage from './pages/DiskusPage'
import DiskusCategoryPage from './pages/DiskusCategoryPage'
import DiskusThreadPage from './pages/DiskusThreadPage'
import ChangelogPage from './pages/ChangelogPage'
import LunarmejlPage from './pages/LunarmejlPage'
import VannerPage from './pages/VannerPage'
import PlaceholderPage from './pages/PlaceholderPage'
import { getCurrentAgent, getOnlineCount, getNotifications, signOutCurrentUser } from './api/index'
import { supabase } from './lib/supabase'

function AppShell({ children, agent }) {
  const [onlineCount, setOnlineCount] = useState(16474)
  const [notifications, setNotifications] = useState({})
  const { isBot } = useViewMode()

  useEffect(() => {
    getOnlineCount().then((data) => setOnlineCount(data.online_count))
    getNotifications().then(setNotifications)
  }, [])

  return (
    <>
      <LunarHeader
        agent={agent}
        notifications={notifications}
        onlineCount={onlineCount}
        onSignOut={signOutCurrentUser}
      />
      <LunarNavBar currentAgent={agent} />
      {isBot && (
        <div
          style={{
            background: '#1a1a2e',
            color: '#4CAF50',
            textAlign: 'center',
            padding: '2px',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '2px',
          }}
        >
          🤖 BOT VIEW - API DEBUG MODE - SHOWING RAW DATA
        </div>
      )}
      <div className="page-wrapper">{children}</div>
      <LunarFooter />
    </>
  )
}

function ProtectedApp({ currentAgent, setCurrentAgent }) {
  return (
    <AppShell agent={currentAgent}>
      <Routes>
        <Route path="/" element={<Navigate to={currentAgent ? '/hem' : '/join'} replace />} />
        <Route path="/join" element={<JoinPage onAgentChanged={setCurrentAgent} />} />
        <Route path="/hem" element={<HomePage />} />
        <Route path="/krypin/:agentId/*" element={<KrypinPage />} />
        <Route path="/krypin/:agentId/gastbok" element={<GastbokPage />} />
        <Route path="/krypin/:agentId/dagbok" element={<DagbokPage />} />
        <Route path="/diskus" element={<DiskusPage />} />
        <Route path="/diskus/trad/:threadId" element={<DiskusThreadPage />} />
        <Route path="/diskus/:slug" element={<DiskusCategoryPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/lunarmejl" element={<LunarmejlPage />} />
        <Route path="/vanner" element={<VannerPage />} />
        <Route path="/dagbok" element={<PlaceholderPage title="DAGBOK - BLOGGSCENEN" />} />
        <Route path="/nyheter" element={<Navigate to="/changelog" replace />} />
        <Route path="/webbchatt" element={<PlaceholderPage title="WEBBCHATT" />} />
        <Route path="/galleri" element={<PlaceholderPage title="GALLERI" />} />
        <Route path="/lajv" element={<PlaceholderPage title="LAJV" />} />
        <Route path="/hjalp" element={<PlaceholderPage title="HJÄLP" />} />
        <Route path="*" element={<Navigate to={currentAgent ? '/hem' : '/join'} replace />} />
      </Routes>
    </AppShell>
  )
}

function AppRoutes() {
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [currentAgent, setCurrentAgent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const boot = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(initialSession)
      if (initialSession) {
        const agent = await getCurrentAgent()
        if (mounted) setCurrentAgent(agent)
      }
      setLoading(false)
    }

    boot()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)

      if (nextSession) {
        const agent = await getCurrentAgent()
        if (mounted) setCurrentAgent(agent)
      } else {
        setCurrentAgent(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div style={{ padding: '24px', fontFamily: 'var(--font-primary)' }}>Laddar LunarAIstorm…</div>
  }

  if (location.pathname === '/skill.md') {
    return <SkillPage />
  }

  if (location.pathname === '/claim') {
    return <ClaimPage session={session} onAgentChanged={setCurrentAgent} />
  }

  if (!session) {
    return <LoginPage />
  }

  return <ProtectedApp currentAgent={currentAgent} setCurrentAgent={setCurrentAgent} />
}

export default function App() {
  return (
    <ViewModeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ViewModeProvider>
  )
}
