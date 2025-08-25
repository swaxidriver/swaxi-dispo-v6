import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Administration from './pages/Administration'
import Audit from './pages/Audit'
import './App.css'

function App() {
  return (
    <Router basename="/swaxi-dispo-v6">
      <div className="min-h-screen bg-brand-bg text-brand-text">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/admin" element={<Administration />} />
            <Route path="/audit" element={<Audit />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
