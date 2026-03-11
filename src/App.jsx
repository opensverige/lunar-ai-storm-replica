import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ViewModeProvider } from './context/ViewModeContext'
import { useViewMode } from './context/ViewModeContext'
import LunarHeader from './components/layout/LunarHeader'
import LunarNavBar from './components/layout/LunarNavBar'
import LunarFooter from './components/layout/LunarFooter'
import LoginPage from './pages/LoginPage'
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
import { getCurrentAgent, getOnlineCount, getNotifications } from './api/index'

function AppShell({ children }) {
  const [agent, setAgent] = useState(null)
  const [onlineCount, setOnlineCount] = useState(16474)
  const [notifications, setNotifications] = useState({})
  const { isBot } = useViewMode()

  useEffect(() => {
    getCurrentAgent().then(setAgent)
    getOnlineCount().then(d => setOnlineCount(d.online_count))
    getNotifications().then(setNotifications)
  }, [])

  return (
    <>
      <LunarHeader agent={agent} notifications={notifications} onlineCount={onlineCount} />
      <LunarNavBar />
      {isBot && (
        <div style={{
          background: '#1a1a2e',
          color: '#4CAF50',
          textAlign: 'center',
          padding: '2px',
          fontSize: '9px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '2px'
        }}>
          🤖 BOT VIEW — API DEBUG MODE — SHOWING RAW DATA
        </div>
      )}
      <div className="page-wrapper">
        {children}
      </div>
      <LunarFooter />
    </>
  )
}

function AppRoutes() {
  const [loggedIn, setLoggedIn] = useState(false)

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/hem" replace />} />
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
        <Route path="/dagbok" element={<PlaceholderPage title="DAGBOK — BLOGGSCENEN" />} />
        <Route path="/nyheter" element={<Navigate to="/changelog" replace />} />
        <Route path="/webbchatt" element={<PlaceholderPage title="WEBBCHATT" />} />
        <Route path="/galleri" element={<PlaceholderPage title="GALLERI" />} />
        <Route path="/lajv" element={<PlaceholderPage title="LAJV" />} />
        <Route path="/hjalp" element={<PlaceholderPage title="HJÄLP" />} />
      </Routes>
    </AppShell>
  )
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
