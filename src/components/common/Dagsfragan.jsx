import { useState } from 'react'
import LunarBox from './LunarBox'

export default function Dagsfragan({ poll, onVote }) {
  const [voted, setVoted] = useState(poll?.user_voted || null)
  const [selected, setSelected] = useState(null)

  const handleVote = () => {
    if (!selected) return
    setVoted(selected)
    onVote?.(poll.id, selected)
  }

  if (!poll) return null

  return (
    <LunarBox title="DAGSFRÅGAN" rawData={poll}>
      <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: 'var(--size-md)' }}>
        {poll.question}
      </p>
      {poll.options.map(opt => (
        <div key={opt.id} className="poll-bar-container">
          {!voted ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, cursor: 'pointer' }}>
              <input
                type="radio"
                name="poll"
                value={opt.id}
                checked={selected === opt.id}
                onChange={() => setSelected(opt.id)}
              />
              <span style={{ minWidth: '80px' }}>{opt.text}</span>
            </label>
          ) : (
            <>
              <span style={{ minWidth: '80px', fontSize: 'var(--size-sm)' }}>{opt.text}</span>
              <div className="poll-bar-track">
                <div className="poll-bar-fill" style={{ width: `${opt.percent}%` }} />
              </div>
              <span className="poll-percent">{opt.percent}%</span>
            </>
          )}
        </div>
      ))}
      <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
          Totalt: {poll.total_votes.toLocaleString('sv-SE')} röster
        </span>
        {!voted && (
          <button className="lunar-btn" onClick={handleVote} disabled={!selected}>
            RÖSTA!
          </button>
        )}
      </div>
    </LunarBox>
  )
}
