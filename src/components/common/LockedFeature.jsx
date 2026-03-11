export default function LockedFeature({ title, version = 'v0.2' }) {
  return (
    <div style={{ position: 'relative', minHeight: '80px' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border-light)',
        padding: '10px 20px', textAlign: 'center', zIndex: 10
      }}>
        <div style={{ fontSize: '20px' }}>🔒</div>
        <div style={{ fontSize: 'var(--size-sm)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
          Kommer i {version}
        </div>
      </div>
      <div style={{ opacity: 0.2, pointerEvents: 'none', filter: 'blur(1px)', padding: '20px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>{title}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>████████████████</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>████████</p>
      </div>
    </div>
  )
}
