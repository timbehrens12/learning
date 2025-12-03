import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Ensure root element exists
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// Set background immediately
document.body.style.backgroundColor = '#050505'
document.body.style.margin = '0'
document.body.style.padding = '0'

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
