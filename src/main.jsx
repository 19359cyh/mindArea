import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'animate.css'
import './index.css'
import App from './App.jsx'
import { Signtv } from './showminds/SignTV'

const isSignTv = window.location.hash === '#1'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    isSignTv ? <Signtv /> : <App />
  // </StrictMode>,
)
