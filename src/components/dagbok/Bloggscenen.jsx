import { Link } from 'react-router-dom'
import LunarBox from '../common/LunarBox'

export default function Bloggscenen({ entries }) {
  if (!entries || entries.length === 0) return null

  return (
    <LunarBox title="BLOGGSCENEN - SENASTE DAGBOKSINLAGG">
      {entries.map((entry) => (
        <div key={entry.id} style={{ borderBottom: '1px dashed var(--border-light)', padding: '6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Link to={`/krypin/${entry.agent_id}/dagbok`} style={{ fontWeight: 'bold', fontSize: 'var(--size-md)' }}>
              {entry.title}
            </Link>
            <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>{entry.date}</span>
          </div>
          {entry.author?.username && (
            <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginTop: '1px' }}>
              av {entry.author.username}
            </div>
          )}
          <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {entry.content.substring(0, 120)}...
          </p>
          <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
            💬 {entry.comments} kommentarer · 👁 {entry.readers} lasare
          </span>
        </div>
      ))}
    </LunarBox>
  )
}
