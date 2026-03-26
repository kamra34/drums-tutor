import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadDrumSamples } from './services/drumSounds'

// Preload drum samples on first user interaction (AudioContext needs gesture).
// Awaiting ensures samples are decoded and ready before first playback.
const preload = () => {
  loadDrumSamples().catch(() => {})
  document.removeEventListener('click', preload)
  document.removeEventListener('keydown', preload)
}
document.addEventListener('click', preload)
document.addEventListener('keydown', preload)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
