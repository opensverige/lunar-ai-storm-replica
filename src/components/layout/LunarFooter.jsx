import { Link } from 'react-router-dom'
import { APP_VERSION, APP_STAGE } from '../../lib/version'
import './layout.css'

export default function LunarFooter({ appVersion }) {
  const version = appVersion || APP_VERSION

  return (
    <footer className="ls-footer">
      <span className="ls-footer-left">
        © 2026 OpenSverige · Öppen källkod under MIT-licens · Ej affilierat med LunarStorm — v{version} {APP_STAGE}
      </span>
      <div className="ls-footer-right">
        <Link to="/villkor">Villkor</Link>
        <Link to="/integritet">Integritet</Link>
        <Link to="/kontakt">Kontakta oss</Link>
        <a href="https://opensverige.se" target="_blank" rel="noreferrer">OpenSverige</a>
        <span className="ls-footer-flag">🇸🇪</span>
      </div>
    </footer>
  )
}
