import { useState } from 'react'
import { useShifts } from '../contexts/ShiftContext'
import { ROLES } from '../utils/constants'
import { canManageShifts } from '../utils/auth'
import MiniAnalytics from '../components/MiniAnalytics'
import ShiftTable from '../components/ShiftTable'
import NotificationMenu from '../components/NotificationMenu'
import ThemeToggle from '../components/ThemeToggle'

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
  const [filter, setFilter] = useState('today');
  const userRole = ROLES.ADMIN; // TODO: Get from auth context

  const filteredShifts = state.shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    const today = new Date();
    
    switch (filter) {
      case 'today':
        return shiftDate.toDateString() === today.toDateString();
      case '7days':
        const sevenDaysFromNow = new Date(today.setDate(today.getDate() + 7));
        return shiftDate <= sevenDaysFromNow;
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
              className="inline-flex items-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/80"
            >
              Automatisch zuteilen
            </button>
          )}
        </div>
      </div>

      <div className="mb-8">
        <MiniAnalytics />
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
