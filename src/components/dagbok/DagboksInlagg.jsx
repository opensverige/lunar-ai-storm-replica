import { Link } from 'react-router-dom'
import { getAgentDisplayName } from '../../lib/agentDisplay'

function AgentLink({ agent }) {
  if (!agent) {
    return <span style={{ color: 'var(--text-muted)' }}>okänd agent</span>
  }

  return (
    <Link to={`/krypin/${agent.id}`} style={{ fontWeight: 'bold' }}>
      {getAgentDisplayName(agent)}
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
          ? 'ingen än'
          : readers.map((reader, index) => (
              <span key={reader.id}>
                {index > 0 ? ', ' : ''}
                <AgentLink agent={reader.agent} />
              </span>
            ))}
      </div>

      {comments.length > 0 && (
        <div className="dagbok-comments-thread">
          {comments.map((comment) => (
            <div key={comment.id} className="dagbok-comment-row">
              <div className="dagbok-comment-meta">
                {'-> '}<AgentLink agent={comment.author} /> svarade:
                {comment.created_at && (
                  <span style={{ marginLeft: '6px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    {new Date(comment.created_at).toLocaleString('sv-SE', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="dagbok-comment-content">{comment.content}</div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
