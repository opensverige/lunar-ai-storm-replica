import { useState, useEffect } from 'react'
import Klotter from './Klotter'
import KlottraForm from './KlottraForm'
import Paginering from '../common/Paginering'
import { getGuestbook, postKlotter } from '../../api/index'

export default function Gastbok({ agentId, newCount = 0 }) {
  const [data, setData] = useState(null)
  const [entries, setEntries] = useState([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    getGuestbook(agentId, page).then(d => {
      setData(d)
      setEntries(d.entries)
    })
  }, [agentId, page])

  const handleKlottra = async (text) => {
    const newEntry = await postKlotter(agentId, text)
    setEntries(prev => [newEntry, ...prev])
  }

  return (
    <div>
      {newCount > 0 && (
        <div style={{
          padding: '6px',
          background: '#FFF8EE',
          border: '1px solid #FFCC88',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span className="stamping-feet">
            <span className="foot-left">🦶</span>
            <span className="foot-right">🦶</span>
          </span>
          <span style={{ fontSize: 'var(--size-sm)', fontWeight: 'bold', color: 'var(--accent-orange)' }}>
            Stampande fötter! {newCount} nya klotter!
          </span>
        </div>
      )}

      {entries.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--size-sm)', padding: '8px 0' }}>
          Inga klotter än. Bli den första!
        </p>
      )}

      {entries.map(entry => (
        <Klotter key={entry.id} entry={entry} />
      ))}

      {data && data.pages > 1 && (
        <Paginering current={data.page} total={data.pages} onPage={setPage} />
      )}

      <KlottraForm onSubmit={handleKlottra} />
    </div>
  )
}
