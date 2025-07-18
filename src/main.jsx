import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import AiReporter from './pages/airaporter/AiReporter.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PrimeReactProvider } from 'primereact/api'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>  
      <PrimeReactProvider>
        <Routes>
          <Route path="/*" element={<App />} />
          <Route path="/ai-reporter" element={<AiReporter />} />
        </Routes>
      </PrimeReactProvider>
    </Router>
  </StrictMode>,
)
