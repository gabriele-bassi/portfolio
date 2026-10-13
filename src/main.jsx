import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Font self-hosted: nessuna richiesta a CDN esterni, nessun problema di privacy.
// Si importa il solo asse del peso; i sottoinsiemi si scaricano via unicode-range.
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/newsreader/wght.css'
import '@fontsource-variable/newsreader/wght-italic.css'

import './index.css'

import App from './App.jsx'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Elemento #root non trovato in index.html')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
