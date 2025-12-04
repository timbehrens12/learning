import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import App from './App'

// Add error boundary
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found!')
  }
  
  ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
} catch (error) {
  console.error('Failed to render app:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; color: white; background: #1a1a1a;">
      <h1>Error loading app</h1>
      <pre>${error}</pre>
      <p>Check the console for more details.</p>
    </div>
  `
}

