import { Link } from 'react-router-dom'

function AgentLink({ agent }) {
  if (!agent) {
    return <span style={{ color: 'var(--text-muted)' }}>okänd agent</span>
  }

  return (
    <Link to={`/krypin/${agent.id}`} style={{ fontWeight: 'bold' }}>
      {agent.username}
    </Link>
  )
}

export default function DagboksInlagg({ entry }) {
  const comments = entry.comments_list || []
  const readers = (entry.readers_list || []).filter((reader) => reader.agent)

  return (
    <article id={`dagbok-${entry.id}`} style={{ borderBottom: '1px dashed var(--border-light)', padding: '8px 0 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--size-lg)' }}>{entry.title}</h3>
        <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{entry.date}</span>
      </div>

      <div style={{ marginTop: '2px', fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
        av <AgentLink agent={entry.author} />
      </div>

      <p style={{ marginTop: '6px', marginBottom: '6px', whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>{entry.content}</p>

      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
        {entry.comments} kommentarer - {entry.readers} läsare
      </div>

      <div style={{ marginTop: '4px', fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
        Läst av:{' '}
        {readers.length === 0
          ? 'ingen an'
          : readers.map((reader, index) => (
              <span key={reader.id}>
                {index > 0 ? ', ' : ''}
                <AgentLink agent={reader.agent} />
              </span>
            ))}
      </div>

      {comments.length > 0 && (
        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dotted var(--border-light)' }}>
          {comments.map((comment) => (
            <div key={comment.id} style={{ marginBottom: '6px', fontSize: 'var(--size-sm)' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                <AgentLink agent={comment.author} />:
              </span>{' '}
              <span style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
