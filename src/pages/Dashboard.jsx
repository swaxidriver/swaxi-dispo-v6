import { useState } from 'react'

import { useShifts } from '../contexts/useShifts'
import { useAuth } from '../contexts/useAuth'
import { ROLES } from '../utils/constants'
import { canManageShifts } from '../utils/auth'
import MiniAnalytics from '../components/MiniAnalytics'
import ShiftTable from '../components/ShiftTable'
import NotificationMenu from '../components/NotificationMenu'
import ThemeToggle from '../components/ThemeToggle'
import ConnectionStatus from '../components/ConnectionStatus'

function QuickFilters({ onChange }) {
  const filters = [
    { id: 'today', name: 'Heute' },
    { id: '7days', name: '7 Tage' },
    { id: 'open', name: 'Offen' },
    { id: 'assigned', name: 'Zugewiesen' },
    { id: 'cancelled', name: 'Abgesagt' },
  ];

  return (
    <div className="flex space-x-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {filter.name}
        </button>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { state } = useShifts();
  const { user } = useAuth();
  const [filter, setFilter] = useState('today');
  const userRole = user?.role || ROLES.ANALYST; // fallback to lowest privilege if unauthenticated

  const handleAnalyticsViewSource = (statId) => {
    // Map analytics stat IDs to filter values that make sense for the user
    switch (statId) {
      case 'open':
        setFilter('open')
        break
      case 'assigned-today':
        setFilter('today') // Show today's shifts (which will include assigned ones)
        break
      case 'conflicts':
        // For conflicts, we'll show all shifts and let the user see which ones have conflicts
        // in the ShiftTable (conflicts are usually displayed as badges or indicators)
        setFilter('all')
        break
      case 'applications-7d':
        setFilter('7days') // Show shifts from last 7 days where applications might be relevant
        break
      default:
        setFilter('today')
    }
  }

  const filteredShifts = state.shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    const today = new Date();
    
    switch (filter) {
      case 'today':
        return shiftDate.toDateString() === today.toDateString();
      case '7days': {
        const sevenDaysFromNow = new Date(today.setDate(today.getDate() + 7));
        return shiftDate <= sevenDaysFromNow;
      }
      case 'open':
        return shift.status === 'open';
      case 'assigned':
        return shift.status === 'assigned';
      case 'cancelled':
        return shift.status === 'cancelled';
      default:
        return true;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Connection Status - NEW: Shows SharePoint/localStorage mode */}
      <div className="mb-6">
        <ConnectionStatus />
      </div>

      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Überblick über alle Dienste und Aktivitäten
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-3 md:ml-4 md:mt-0">
          <NotificationMenu />
          <ThemeToggle />
          {canManageShifts(userRole) && (
            <button
              type="button"
              onClick={() => alert('Easter Egg: Automatische Zuteilung... Nein, das machen wir doch lieber manuell! 😉')}
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm bg-[var(--color-primary)] hover:opacity-90"
            >
              Automatisch zuteilen
            </button>
          )}
        </div>
      </div>

      <div className="mb-8">
        <MiniAnalytics onViewSource={handleAnalyticsViewSource} />
      </div>

      <div className="mb-4">
        <QuickFilters onChange={setFilter} />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Aktuelle Dienste</h2>
        <ShiftTable shifts={filteredShifts} />
      </div>
    </div>
  )
}
