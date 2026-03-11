import { useState } from 'react'
import { useViewMode } from '../../context/ViewModeContext'

export default function LunarBox({ title, children, rawData = null, className = '' }) {
  const [showRaw, setShowRaw] = useState(false)
  const { isBot } = useViewMode()

  return (
    <div className={`lunar-box ${className}`}>
      {title && (
        <div className="lunar-box-header" style={isBot ? { background: 'linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%)' } : {}}>
          <span>{title}</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {isBot && rawData && (
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                JSON
              </span>
            )}
            {!isBot && rawData && (
              <button className="raw-btn" onClick={() => setShowRaw(!showRaw)}>
                {showRaw ? 'DÖLJ' : '[RAW]'}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="lunar-box-body">
        {!isBot && showRaw && rawData ? (
          <pre className="json-block">{JSON.stringify(rawData, null, 2)}</pre>
        ) : (
          <>
            {children}
            {isBot && rawData && (
              <div style={{ marginTop: '8px', borderTop: '1px dashed var(--border-light)', paddingTop: '6px' }}>
                <pre className="json-block" style={{
                  background: '#1a1a2e', color: '#e0e0e0',
                  maxHeight: '200px', overflow: 'auto'
                }}>{JSON.stringify(rawData, null, 2)}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
