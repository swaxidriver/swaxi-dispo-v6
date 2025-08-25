import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ShiftProvider } from './contexts/ShiftContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Administration from './pages/Administration'
import Audit from './pages/Audit'
import './App.css'

const APP_VERSION = '5.3.0'

function VersionBanner() {
  return (
    <div className="bg-brand-accent text-white px-4 py-2 text-center text-sm">
      <span>Version {APP_VERSION} verfügbar! Die Seite verwendet die neueste Version.</span>
    </div>
  )
}

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
            <VersionBanner />
            <Navigation />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/admin" element={<Administration />} />
                <Route path="/audit" element={<Audit />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ShiftProvider>
    </ThemeProvider>
  )
}

export default App
