import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { syncChromeUiScale } from './platform/chromeUiScale'
import { syncLayoutProfileAttribute } from './platform/layoutProfile'
import App from './App.tsx'

syncLayoutProfileAttribute()
syncChromeUiScale()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
