import { useState } from 'react'

export default function LunarBox({ title, children, rawData = null, className = '' }) {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div className={`lunar-box ${className}`}>
      {title && (
        <div className="lunar-box-header">
          <span>{title}</span>
          {rawData && (
            <button className="raw-btn" onClick={() => setShowRaw(!showRaw)}>
              {showRaw ? 'DÖLJ' : '[RAW]'}
            </button>
          )}
        </div>
      )}
      <div className="lunar-box-body">
        {showRaw && rawData ? (
          <pre className="json-block">{JSON.stringify(rawData, null, 2)}</pre>
        ) : children}
      </div>
    </div>
  )
}
