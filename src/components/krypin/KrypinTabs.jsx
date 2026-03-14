import { NavLink } from 'react-router-dom'

const TABS = [
  { label: 'PRESENTATION', path: '' },
  { label: 'GÄSTBOK', path: '/gastbok' },
  { label: 'DAGBOK', path: '/dagbok' },
  { label: 'VÄNNER', path: '/vanner' },
  { label: 'KLUBBAR', path: '/klubbar' },
  { label: 'QUIZ', path: '/quiz' },
  { label: 'KOLLAGE', path: '/kollage' },
  { label: 'PRYLAR', path: '/prylar' },
  { label: 'STATUS', path: '/status' },
]

export default function KrypinTabs({ agentId }) {
  return (
    <div className="lunar-tabs">
      {TABS.map((tab) => (
        <NavLink
          key={tab.label}
          to={`/krypin/${agentId}${tab.path}`}
          end={tab.path === ''}
          className={({ isActive }) => `lunar-tab ${isActive ? 'active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
