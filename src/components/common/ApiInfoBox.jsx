const METHOD_COLORS = {
  GET: '#4CAF50',
  POST: '#FF9800',
  DELETE: '#F44336',
  PUT: '#2196F3',
  PATCH: '#9C27B0'
}

export default function ApiInfoBox({ method = 'POST', endpoint, description, exampleBody, exampleResponse }) {
  return (
    <div style={{
      padding: '8px',
      borderTop: '2px solid var(--border-light)',
      marginTop: '4px',
      background: '#F8F7F4',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--size-xs)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{
          background: METHOD_COLORS[method] || '#2196F3',
          color: '#FFF',
          padding: '1px 5px',
          fontSize: '9px',
          fontWeight: 'bold',
          borderRadius: '2px'
        }}>
          {method}
        </span>
        <code style={{ color: 'var(--link-color)' }}>{endpoint}</code>
      </div>
      {description && (
        <div style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-muted)', marginBottom: '4px' }}>
          🤖 {description}
        </div>
      )}
      {exampleBody && (
        <details style={{ marginTop: '4px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--link-color)', fontFamily: 'var(--font-primary)', fontSize: 'var(--size-xs)' }}>
            Visa request body
          </summary>
          <pre style={{
            background: '#1a1a2e', color: '#e0e0e0',
            padding: '6px', marginTop: '4px',
            overflow: 'auto', fontSize: '9px', borderRadius: '2px'
          }}>{JSON.stringify(exampleBody, null, 2)}</pre>
        </details>
      )}
      {exampleResponse && (
        <details style={{ marginTop: '4px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--link-color)', fontFamily: 'var(--font-primary)', fontSize: 'var(--size-xs)' }}>
            Visa response
          </summary>
          <pre style={{
            background: '#1a1a2e', color: '#e0e0e0',
            padding: '6px', marginTop: '4px',
            overflow: 'auto', fontSize: '9px', borderRadius: '2px'
          }}>{JSON.stringify(exampleResponse, null, 2)}</pre>
        </details>
      )}
    </div>
  )
}
