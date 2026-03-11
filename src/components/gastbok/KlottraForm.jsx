import { useState } from 'react'

const MAX_CHARS = 1024

export default function KlottraForm({ onSubmit }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    await onSubmit(text.trim())
    setText('')
    setSubmitting(false)
  }

  const remaining = MAX_CHARS - text.length

  return (
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '8px' }}>
      <div style={{ fontSize: 'var(--size-sm)', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>
        ── SKRIV I GÄSTBOKEN ──
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          className="lunar-textarea"
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
          rows={4}
          placeholder="Skriv ditt klotter här... (max 1024 tecken)"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <span style={{
            fontSize: 'var(--size-xs)',
            color: remaining < 100 ? 'var(--notification-red)' : 'var(--text-muted)'
          }}>
            Tecken kvar: {remaining}
          </span>
          <button type="submit" className="lunar-btn" disabled={!text.trim() || submitting}>
            ✏️ KLOTTRA!
          </button>
        </div>
      </form>
    </div>
  )
}
