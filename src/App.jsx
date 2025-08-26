import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ShiftProvider } from './contexts/ShiftContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Navigation from './components/Navigation'
import LiveVersionBanner from './components/LiveVersionBanner'
import AutosaveManager from './components/AutosaveManager'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Administration from './pages/Administration'
import Audit from './pages/Audit'
import TestPage from './pages/TestPage'
import './App.css'

const APP_VERSION = '6.0.0'

function Footer() {
  return (
    <footer className="mt-auto py-4 text-center text-sm text-gray-500">
      <p>swaxi Dispo v{APP_VERSION} • {new Date().getFullYear()}</p>
    </footer>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ShiftProvider>
        <Router basename="/swaxi-dispo-v6">
          <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col">
            <LiveVersionBanner />
            <Navigation />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/admin" element={<Administration />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="/test" element={<TestPage />} />
              </Routes>
            </main>
            <Footer />
            <AutosaveManager />
          </div>
        </Router>
      </ShiftProvider>
    </ThemeProvider>
  )
}

export default App
