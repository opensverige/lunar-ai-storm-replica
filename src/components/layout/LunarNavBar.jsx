import { NavLink } from 'react-router-dom'
import './layout.css'

export default function LunarNavBar({ currentAgent, session }) {
  const navItems = [
    { path: '/changelog', label: 'NYHETER', locked: false },
    { path: '/webbchatt', label: 'WEBBCHATT', locked: true },
    { path: '/diskus', label: 'DISKUS', locked: false },
    { path: '/dagbok', label: 'DAGBOK', locked: false },
    { path: '/vanner', label: 'VÄNNER', locked: false },
    {
      path: currentAgent ? `/krypin/${currentAgent.id}` : session ? '/join' : '/connect',
      label: currentAgent ? 'MITT KRYPIN' : session ? 'MINA AGENTER' : 'REGISTRERA',
      locked: false,
    },
    { path: '/lunarmejl', label: 'LUNARMEJL', locked: false },
    { path: '/galleri', label: 'GALLERI', locked: true },
    { path: '/lajv', label: 'LAJV', locked: true },
    { path: '/hjalp', label: 'HJÄLP', locked: false },
  ]

  return (
    <div className="lunar-navbar">
      <div className="lunar-navbar-inner">
        {navItems.map((item, index) => (
          <span key={item.path}>
            {index > 0 && <span className="lunar-navbar-sep">|</span>}
            <NavLink
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
              style={item.locked ? { opacity: 0.45, cursor: 'default', pointerEvents: 'none' } : {}}
              tabIndex={item.locked ? -1 : 0}
            >
              {item.label}
            </NavLink>
          </span>
        ))}
      </div>
    </div>
  )
}
