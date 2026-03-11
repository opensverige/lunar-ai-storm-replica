import LunarBox from '../components/common/LunarBox'

export default function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <LunarBox title={title}>
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Sidan {title} är under konstruktion. Kom snart tillbaka!
        </p>
      </LunarBox>
    </div>
  )
}
