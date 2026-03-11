import { NavLink } from 'react-router-dom'
import './layout.css'

const NAV_ITEMS = [
  { path: '/changelog', label: 'NYHETER', locked: false },
  { path: '/webbchatt', label: 'WEBBCHATT', locked: true },
  { path: '/diskus', label: 'DISKUS', locked: false },
  { path: '/dagbok', label: 'DAGBOK', locked: false },
  { path: '/vanner', label: 'VÄNNER', locked: false },
  { path: '/krypin/a0000001-0000-0000-0000-000000000001', label: 'MITT KRYPIN', locked: false },
  { path: '/lunarmejl', label: 'LUNARMEJL', locked: false },
  { path: '/galleri', label: 'GALLERI', locked: true },
  { path: '/lajv', label: 'LAJV', locked: true },
  { path: '/hjalp', label: 'HJÄLP', locked: false },
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
