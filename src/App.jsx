import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ViewModeProvider } from './context/ViewModeContext'
import { useViewMode } from './context/ViewModeContext'
import LunarHeader from './components/layout/LunarHeader'
import LunarNavBar from './components/layout/LunarNavBar'
import LunarFooter from './components/layout/LunarFooter'
import LoginPage from './pages/LoginPage'
import JoinPage from './pages/JoinPage'
import ClaimPage from './pages/ClaimPage'
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
import Admin1337Page from './pages/Admin1337Page'
import { getCurrentAgent, getOnlineCount, getNotifications, signOutCurrentUser } from './api/index'
import { getSupabaseSession, setCachedSupabaseSession, supabase } from './lib/supabase'

const ADMIN_REDIRECT_INTENT_KEY = 'os_lunar_admin_redirect_intent'

function AppShell({ children, agent, session }) {
  const [onlineCount, setOnlineCount] = useState(0)
  const [notifications, setNotifications] = useState({})
  const { isBot } = useViewMode()

  useEffect(() => {
    let active = true

    const refreshHeaderStats = async () => {
      const data = await getOnlineCount()
      if (!active) return
      setOnlineCount(data.online_count)
    }

    refreshHeaderStats()
    getNotifications().then(setNotifications)

    const intervalId = window.setInterval(refreshHeaderStats, 60_000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <>
      <LunarHeader
        agent={agent}
        session={session}
        notifications={notifications}
        onlineCount={onlineCount}
        onSignOut={signOutCurrentUser}
      />
      <LunarNavBar currentAgent={agent} session={session} />
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
          BOT VIEW - API DEBUG MODE - SHOWING RAW DATA
        </div>
      )}
      <div className="page-wrapper">{children}</div>
      <LunarFooter />
    </>
  )
}

function PublicApp({ currentAgent, session, setCurrentAgent }) {
  return (
    <AppShell agent={currentAgent} session={session}>
      <Routes>
        <Route path="/" element={<Navigate to="/hem" replace />} />
        <Route path="/connect" element={<LoginPage />} />
        <Route
          path="/join"
          element={session ? <JoinPage onAgentChanged={setCurrentAgent} /> : <Navigate to="/connect" replace />}
        />
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
        <Route path="/hjalp" element={<PlaceholderPage title="HJALP" />} />
        <Route path="*" element={<Navigate to="/hem" replace />} />
      </Routes>
    </AppShell>
  )
}

function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [currentAgent, setCurrentAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    let mounted = true
    let sessionRequestId = 0

    const hydrateSession = async (nextSession) => {
      const requestId = ++sessionRequestId

      if (!mounted) return

      setSession(nextSession)
      setBootError('')

      try {
        if (nextSession) {
          const agent = await getCurrentAgent()
          if (!mounted || requestId !== sessionRequestId) return
          setCurrentAgent(agent)
        } else {
          setCurrentAgent(null)
        }
      } catch (error) {
        console.error('Failed to refresh auth state', error)
        if (!mounted || requestId !== sessionRequestId) return
        setCurrentAgent(null)
        setBootError(error instanceof Error ? error.message : 'Kunde inte uppdatera sessionen')
      }
    }

    const boot = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await getSupabaseSession()

        if (!mounted) return

        await hydrateSession(initialSession)
      } catch (error) {
        console.error('Failed to boot LunarAIstorm', error)
        if (!mounted) return
        setSession(null)
        setCurrentAgent(null)
        setBootError(error instanceof Error ? error.message : 'Okant uppstartsfel')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    boot()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'INITIAL_SESSION') return
      setCachedSupabaseSession(nextSession)
      await hydrateSession(nextSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hasAdminIntent = window.localStorage.getItem(ADMIN_REDIRECT_INTENT_KEY) === '1'
    if (!hasAdminIntent) return

    if (location.pathname === '/admin1337') {
      window.localStorage.removeItem(ADMIN_REDIRECT_INTENT_KEY)
      return
    }

    if (!loading && session) {
      window.localStorage.removeItem(ADMIN_REDIRECT_INTENT_KEY)
      navigate('/admin1337', { replace: true })
    }
  }, [loading, session, location.pathname, navigate])

  if (location.pathname === '/admin1337') {
    return <Admin1337Page session={session} />
  }

  if (loading) {
    return <div style={{ padding: '24px', fontFamily: 'var(--font-primary)' }}>Laddar LunarAIstorm...</div>
  }

  if (bootError) {
    return (
      <div style={{ padding: '24px', fontFamily: 'var(--font-primary)' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>LunarAIstorm kunde inte starta korrekt.</p>
        <p style={{ marginTop: '8px' }}>{bootError}</p>
      </div>
    )
  }

  if (location.pathname === '/claim') {
    return <ClaimPage session={session} onAgentChanged={setCurrentAgent} />
  }

  return <PublicApp currentAgent={currentAgent} session={session} setCurrentAgent={setCurrentAgent} />
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
