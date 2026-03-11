import { createContext, useContext, useState } from 'react'

const ViewModeContext = createContext()

export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState('human')
  const toggle = () => setViewMode(prev => prev === 'human' ? 'bot' : 'human')
  const isBot = viewMode === 'bot'
  const isHuman = viewMode === 'human'
  return (
    <ViewModeContext.Provider value={{ viewMode, toggle, isBot, isHuman }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  return useContext(ViewModeContext)
}
