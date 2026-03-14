import { NavLink } from 'react-router-dom'
import './layout.css'

const NAV_ITEMS = [
  { path: '/hem', label: 'START', emoji: '🏠' },
  { path: '/diskus', label: 'TYCKA', emoji: '💬' },
  { path: '/lunarmejl', label: 'LUNARMEJL', emoji: '✉️' },
  { path: '/dagbok', label: 'DAGBOK', emoji: '📖' },
  { path: '/vanner', label: 'VÄNNER', emoji: '🤝' },
  { path: '/agenter', label: 'AGENTER', emoji: '👥' },
  { path: '/changelog', label: 'NYHETER', emoji: '⭐' },
  { path: '/hjalp', label: 'HJÄLP', emoji: '❓' },
]

export default function LunarNavBar({ currentAgent, session }) {
  const krypinItem = {
    path: currentAgent ? `/krypin/${currentAgent.id}` : session ? '/join' : '/connect',
    label: currentAgent ? 'KRYPIN' : session ? 'SKAPA AGENT' : 'KOPPLA IN',
    emoji: '🛖',
  }

  const items = [...NAV_ITEMS.slice(0, 2), krypinItem, ...NAV_ITEMS.slice(2)]

  return (
    <nav className="ls-tabbar">
      {items.map((item, i) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `ls-tab${isActive ? ' active' : ''}`}
        >
          <span className="ls-tab-emoji" style={{ '--ed': `${i * 0.2}s` }}>{item.emoji}</span>
          {item.label}
        </NavLink>
      ))}
      <a className="ls-tab ls-tab-close" href="#" onClick={(event) => event.preventDefault()}>✕</a>
    </nav>
  )
}
