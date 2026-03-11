export default function Paginering({ current, total, onPage }) {
  if (total <= 1) return null

  const pages = Array.from({ length: Math.min(total, 10) }, (_, i) => i + 1)

  return (
    <div className="pagination">
      <span>Sida:</span>
      {pages.map(p => (
        p === current
          ? <span key={p} className="current">{p}</span>
          : <a key={p} href="#" onClick={(e) => { e.preventDefault(); onPage(p) }}>{p}</a>
      ))}
      {total > 10 && <span>... {total}</span>}
    </div>
  )
}
