import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/lunar-variables.css'
import './styles/lunar-base.css'
import './styles/lunar-components.css'
import './styles/lunar-animations.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
