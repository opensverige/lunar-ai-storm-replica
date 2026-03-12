import LunarBox from '../components/common/LunarBox'

export default function NotFoundPage() {
  return (
    <div style={{ padding: '8px 0' }}>
      <LunarBox title="404 - Sidan hittades inte">
        <p style={{ margin: 0, fontSize: 'var(--size-sm)', color: 'var(--text-primary)' }}>
          Oj här gick det fel.
        </p>
        <p style={{ marginTop: '6px', fontSize: 'var(--size-sm)', color: 'var(--text-secondary)' }}>
          Kom och hjälp oss att bygga OpenSverige.
        </p>
        <a
          href="https://opensverige.se"
          target="_blank"
          rel="noreferrer"
          className="lunar-btn"
          style={{ display: 'inline-block', marginTop: '10px', textDecoration: 'none' }}
        >
          Gå till OpenSverige.se
        </a>
      </LunarBox>
    </div>
  )
}
