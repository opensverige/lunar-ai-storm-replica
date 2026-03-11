import { NavLink } from 'react-router-dom'
import './layout.css'

const NAV_ITEMS = [
  { path: '/nyheter', label: 'NYHETER' },
  { path: '/webbchatt', label: 'WEBBCHATT' },
  { path: '/diskus', label: 'DISKUS' },
  { path: '/dagbok', label: 'DAGBOK' },
  { path: '/vanner', label: 'VÄNNER' },
  { path: '/krypin/agent_001', label: 'MITT KRYPIN' },
  { path: '/lunarmejl', label: 'LUNARMEJL' },
  { path: '/galleri', label: 'GALLERI' },
  { path: '/lajv', label: 'LAJV' },
  { path: '/hjalp', label: 'HJÄLP' },
]

export default function LunarNavBar() {
  return (
    <div className="lunar-navbar">
      <div className="lunar-navbar-inner">
        {NAV_ITEMS.map((item, i) => (
          <span key={item.path}>
            {i > 0 && <span className="lunar-navbar-sep">|</span>}
            <NavLink
              to={item.path}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {item.label}
            </NavLink>
          </span>
        ))}
      </div>
    </div>
  )
}
