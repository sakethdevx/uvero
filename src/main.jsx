import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthProvider'
import { checkVersion } from './lib/versionCheck'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

// Check for newer builds after the UI is on screen so a slow network request
// to version.json does not delay the initial render of the app shell.
const scheduleVersionCheck = window.requestIdleCallback
  ? window.requestIdleCallback.bind(window)
  : (callback) => window.setTimeout(callback, 0)

scheduleVersionCheck(() => {
  checkVersion()
})
