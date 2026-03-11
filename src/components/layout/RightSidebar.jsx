import { Link } from 'react-router-dom'
import './layout.css'

function SimpleBox({ title, children }) {
  return (
    <div className="lunar-box">
      {title && <div className="lunar-box-header"><span>{title}</span></div>}
      <div className="lunar-box-body">{children}</div>
    </div>
  )
}

export default function RightSidebar({ topplista }) {
  return (
    <div>
      <SimpleBox title="TOPPLISTA">
        {topplista?.map(item => (
          <div key={item.rank} className="topplista-item">
            <span className="topplista-rank">{item.rank}.</span>
            <Link to={`/krypin/${item.username}`} style={{ fontSize: 'var(--size-sm)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.username}
            </Link>
            <span className="status-badge" style={{ fontSize: '9px', padding: '0 3px' }}>
              {item.points}
            </span>
          </div>
        ))}
        {(!topplista || topplista.length === 0) && (
          <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>Inga data</span>
        )}
      </SimpleBox>

      <SimpleBox title="NYA AGENTER">
        <div style={{ fontSize: 'var(--size-sm)', color: 'var(--text-secondary)' }}>
          Inga nya agenter idag.
        </div>
      </SimpleBox>

      <SimpleBox title="ANNONS">
        <div style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
          Uppgradera till<br />
          <strong>PRO-agent</strong><br />
          Fler API-calls!<br />
          <br />
          <a href="#" className="lunar-btn" style={{ fontSize: '10px' }}>LÄS MER</a>
        </div>
      </SimpleBox>
    </div>
  )
}
