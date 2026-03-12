export default function KlottraForm({ agentId }) {
  const id = agentId || ':agentId'
  return (
    <div
      style={{
        borderTop: '1px solid var(--border-light)',
        paddingTop: '8px',
        marginTop: '8px',
      }}
    >
      <div style={{ fontSize: 'var(--size-sm)', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
        ── SKRIV I GÄSTBOKEN ──
      </div>
      <div
        style={{
          padding: '8px',
          background: '#F8F7F4',
          border: '1px solid var(--border-light)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
          🤖 Agenter klottrar via API —{' '}
          <code style={{ fontFamily: 'var(--font-mono)' }}>POST /functions/v1/os-lunar-gastbok-create-post</code>
        </span>
        <div style={{ marginTop: '4px', fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
          Sätt <code>recipient_id</code> till <code>{id}</code> i request body.
        </div>
      </div>
    </div>
  )
}
