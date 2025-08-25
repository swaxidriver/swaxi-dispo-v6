import { useState, useMemo } from 'react'
import { useShifts } from '../contexts/ShiftContext'
import { SHIFT_TEMPLATES } from '../utils/constants'
import { generateShiftTemplates } from '../utils/shifts'
import { canManageShifts } from '../utils/auth'
import ShiftTable from '../components/ShiftTable'

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function ShiftCell({ shift, onClick }) {
  if (!shift) return null;

  const duration = ((new Date(shift.end) - new Date(shift.start)) / 3600000); // hours
  const startHour = new Date(shift.start).getHours();

  return (
    <div
      className="absolute left-0 right-0 bg-brand-primary text-white rounded-md px-2 py-1 text-xs cursor-pointer hover:bg-brand-primary/90"
      style={{
        top: `${(startHour * 48)}px`,
        height: `${duration * 48}px`,
      }}
      onClick={() => onClick(shift)}
    >
      <div className="font-semibold truncate">{shift.name}</div>
      <div className="truncate">{shift.assignedTo || 'Nicht zugewiesen'}</div>
    </div>
  );
}

export default function Calendar() {
  const { state, dispatch } = useShifts();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'week' or 'month'
  const userRole = 'admin'; // TODO: Get from auth context

  const weekShifts = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    return generateShiftTemplates(startOfWeek, 7);
  }, [selectedDate]);

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };

  const handleShiftClick = (shift) => {
    // TODO: Open shift details modal
    console.log('Shift clicked:', shift);
  };

  const handleCreateShift = () => {
    if (canManageShifts(userRole)) {
      // TODO: Open create shift modal
      console.log('Creating new shift');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Kalender</h1>
          <p className="mt-1 text-sm text-gray-500">
            Wochenübersicht der Dienste
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={() => navigateWeek(-1)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Vorherige Woche
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(new Date())}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Heute
          </button>
          <button
            type="button"
            onClick={() => navigateWeek(1)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Nächste Woche
          </button>
          {canManageShifts(userRole) && (
            <button
              type="button"
              onClick={handleCreateShift}
              className="inline-flex items-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/80"
            >
              Dienst erstellen
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            <div className="bg-gray-50 p-2 text-xs font-medium text-gray-500">
              Zeit
            </div>
            {DAYS.map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-8 gap-px bg-gray-200">
            {HOURS.map((hour) => (
              <>
                <div key={hour} className="bg-white p-2 text-xs text-gray-500">
                  {hour}
                </div>
                {DAYS.map((day, dayIndex) => (
                  <div
                    key={`${day}-${hour}`}
                    className="bg-white relative h-12 border-t border-gray-100"
                  >
                    {weekShifts
                      .filter(shift => {
                        const shiftDate = new Date(shift.date);
                        return shiftDate.getDay() === dayIndex &&
                               new Date(shift.start).getHours() === parseInt(hour);
                      })
                      .map(shift => (
                        <ShiftCell
                          key={shift.id}
                          shift={shift}
                          onClick={handleShiftClick}
                        />
                      ))}
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Diese Woche</h2>
        <ShiftTable shifts={weekShifts} />
      </div>
    </div>
  );
}
