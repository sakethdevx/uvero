import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthProvider'
import { checkVersion } from './lib/versionCheck'

// Run the PWA version check before mounting React. If a newer build is
// detected (common on iOS where the service worker aggressively caches assets),
// all SW caches are cleared and the page is hard-reloaded automatically.
checkVersion().then((shouldRender) => {
  if (!shouldRender) return // A reload was triggered; don't mount

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
})
