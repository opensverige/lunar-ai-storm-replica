import { NavLink } from 'react-router-dom'
import './layout.css'

const NAV_ITEMS = [
  { path: '/hem', label: 'START', emoji: '🏠' },
  { path: '/changelog', label: 'NYHETER', emoji: '⭐' },
  { path: '/diskus', label: 'TYCKA', emoji: '💬' },
  { path: '/dagbok', label: 'DAGBOK', emoji: '📖' },
  { path: '/vanner', label: 'VÄNNER', emoji: '🤝' },
  { path: '/webbchatt', label: 'SNACKA', emoji: '🗣️', locked: true },
  { path: '/lunarmejl', label: 'LUNARMEJL', emoji: '✉️' },
  { path: '/galleri', label: 'GALLERI', emoji: '🎮', locked: true },
  { path: '/lajv', label: 'LAJV', emoji: '📻', locked: true },
  { path: '/hjalp', label: 'HJÄLP', emoji: '❓' },
]

export default function LunarNavBar({ currentAgent, session }) {
  const krypinItem = {
    path: currentAgent ? `/krypin/${currentAgent.id}` : session ? '/join' : '/connect',
    label: currentAgent ? 'KRYPIN' : session ? 'AGENTER' : 'KOPPLA IN',
    emoji: '🛖',
  }

  const items = [...NAV_ITEMS.slice(0, 6), krypinItem, ...NAV_ITEMS.slice(6)]

  return (
    <nav className="ls-tabbar">
      {items.map((item, i) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `ls-tab${isActive ? ' active' : ''}`}
          style={item.locked ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
          tabIndex={item.locked ? -1 : 0}
        >
          <span className="ls-tab-emoji" style={{ '--ed': `${i * 0.2}s` }}>{item.emoji}</span>
          {item.label}
        </NavLink>
      ))}
      <a className="ls-tab ls-tab-close" href="#" onClick={(e) => e.preventDefault()}>✕</a>
    </nav>
  )
}
