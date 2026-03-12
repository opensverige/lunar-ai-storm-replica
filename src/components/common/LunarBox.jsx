import { useEffect, useMemo, useState } from 'react'
import { useViewMode } from '../../context/ViewModeContext'

export default function LunarBox({ title, children, rawData = null, className = '' }) {
  const [showRaw, setShowRaw] = useState(false)
  const { isBot } = useViewMode()
  const hasRawData = rawData !== null && rawData !== undefined

  const rawJson = useMemo(() => {
    if (!hasRawData) return ''
    try {
      return JSON.stringify(rawData, null, 2)
    } catch (error) {
      return `{"error":"raw_data_not_serializable","message":"${String(error?.message || 'Unknown error')}"}`
    }
  }, [hasRawData, rawData])

  useEffect(() => {
    if (!showRaw) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setShowRaw(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showRaw])

  return (
    <div className={`lunar-box ${className}`}>
      {title && (
        <div className="lunar-box-header" style={isBot ? { background: 'linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%)' } : {}}>
          <span>{title}</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {isBot && hasRawData && (
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                JSON
              </span>
            )}
            {!isBot && hasRawData && (
              <button
                type="button"
                className="raw-btn"
                aria-expanded={showRaw}
                onClick={() => setShowRaw((prev) => !prev)}
              >
                {showRaw ? '[DÖLJ]' : '[RAW]'}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="lunar-box-body">
        {!isBot && showRaw && hasRawData ? (
          <div className="lunar-raw-panel">
            <div className="lunar-raw-toolbar">
              <span>Rå JSON</span>
              <button type="button" className="raw-btn" onClick={() => setShowRaw(false)}>
                Stäng
              </button>
            </div>
            <pre className="json-block lunar-raw-json">{rawJson}</pre>
          </div>
        ) : (
          <>
            {children}
            {isBot && hasRawData && (
              <div style={{ marginTop: '8px', borderTop: '1px dashed var(--border-light)', paddingTop: '6px' }}>
                <pre
                  className="json-block"
                  style={{
                    background: '#1a1a2e',
                    color: '#e0e0e0',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                >
                  {rawJson}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
