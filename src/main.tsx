import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/alfa-slab-one/400.css'
import '@fontsource/oswald/400.css'
import '@fontsource/oswald/600.css'
import '@fontsource/special-elite/400.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/600.css'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Appli installable sur le téléphone (en production seulement : en développement le cache gênerait)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
