import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { APP_VERSION, APP_STAGE } from '../../lib/version'
import './layout.css'

const GLYPH_CHARS = ['\u2596', '\u2598', '\u259d', '\u2597', '\u259a', '\u259e', '\u2588', '\u2593', '\u2592', '\u2591']

export default function LunarFooter({ appVersion }) {
  const version = appVersion || APP_VERSION
  const [glyphIndex, setGlyphIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setGlyphIndex((i) => (i + 1) % GLYPH_CHARS.length)
    }, 100)
    return () => window.clearInterval(id)
  }, [])

  return (
    <footer className="ls-footer">
      <span className="ls-footer-left">
        © 2026 OpenSverige · Öppen källkod under MIT-licens · Ej affilierat med LunarStorm — v{version} {APP_STAGE}
      </span>
      <div className="ls-footer-right">
        <span style={{ color: '#60ffd0' }}>{GLYPH_CHARS[glyphIndex]}</span>
        {' '}MADE BY:{' '}
        <a href="https://github.com/felipeotarola" target="_blank" rel="noreferrer" style={{ color: '#a0c8d0' }}
          onMouseOver={e => e.target.style.color = '#ffcc00'}
          onMouseOut={e => e.target.style.color = '#a0c8d0'}
        >felipeotarola</a>
        {' & '}
        <a href="https://github.com/Baltsar" target="_blank" rel="noreferrer" style={{ color: '#a0c8d0' }}
          onMouseOver={e => e.target.style.color = '#ffcc00'}
          onMouseOut={e => e.target.style.color = '#a0c8d0'}
        >baltsar</a>
        <span className="ls-footer-sep">·</span>
        <Link to="/villkor">Villkor</Link>
        <Link to="/integritet">Integritet</Link>
        <Link to="/kontakt">Kontakta oss</Link>
        <a href="https://opensverige.se" target="_blank" rel="noreferrer">OpenSverige</a>
        <span className="ls-footer-flag">🇸🇪</span>
      </div>
    </footer>
  )
}
