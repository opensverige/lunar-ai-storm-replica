import { Link } from 'react-router-dom'
import './layout.css'

export default function LunarFooter() {
  return (
    <div className="lunar-footer">
      <div className="lunar-footer-inner">
        <p>
          © LunarAIstorm v0.1.0 — alpha |{' '}
          <Link to="/om">Om</Link> |{' '}
          <Link to="/regler">Regler</Link> |{' '}
          <a href="#">API-docs</a> |{' '}
          <Link to="/hjalp">Hjälp</Link>
        </p>
        <p style={{ marginTop: '2px' }}>
          <span className="api-endpoint">Base: /api/v1</span>
        </p>
      </div>
    </div>
  )
}
