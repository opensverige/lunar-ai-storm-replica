export default function DagboksInlagg({ entry }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
        <h3 style={{ fontSize: 'var(--size-lg)', fontWeight: 'bold', color: 'var(--link-color)' }}>
          {entry.title}
        </h3>
        <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
          ── {entry.date} ──
        </span>
      </div>
      <p style={{
        fontSize: 'var(--size-base)',
        lineHeight: '1.6',
        color: 'var(--text-primary)',
        whiteSpace: 'pre-line'
      }}>
        {entry.content}
      </p>
      <div style={{ marginTop: '6px', fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
        💬 {entry.comments} kommentarer · 👁 {entry.readers} läsare
      </div>
    </div>
  )
}
