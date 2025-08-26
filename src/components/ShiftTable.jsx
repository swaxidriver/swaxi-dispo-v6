import { useState } from 'react'
import { useShifts } from '../contexts/ShiftContext'
import { SHIFT_STATUS, WORK_LOCATIONS } from '../utils/constants'
import { canManageShifts } from '../utils/auth'
import SeriesApplicationModal from './SeriesApplicationModal'

export default function ShiftTable({ shifts, showActions = true }) {
  const { dispatch, applyToShift } = useShifts();
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const userRole = 'disponent'; // TODO: Get from auth context

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case SHIFT_STATUS.OPEN:
        return 'bg-blue-100 text-blue-800';
      case SHIFT_STATUS.ASSIGNED:
        return 'bg-green-100 text-green-800';
      case SHIFT_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApply = (shiftId) => {
    applyToShift(shiftId, 'current-user'); // TODO: Get real user ID
    console.log('Applied to shift:', shiftId);
  };

  const handleAssign = (shiftId) => {
    // Debug point: Add a debugger statement
    // debugger; // Commented out for production
    console.log('Assigning shift:', shiftId);
    // TODO: Implement assignment logic
    const shift = shifts.find(s => s.id === shiftId);
    console.log('Shift details:', shift);
  };

  const handleCancel = (shiftId) => {
    dispatch({
      type: 'UPDATE_SHIFT',
      payload: {
        ...shifts.find(s => s.id === shiftId),
        status: SHIFT_STATUS.CANCELLED
      }
    });
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {shifts.map((shift) => (
          <li key={shift.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-brand-primary truncate">
                  {shift.date instanceof Date 
                    ? shift.date.toLocaleDateString('de-DE', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit' 
                      }) 
                    : shift.date} • {shift.start}-{shift.end}
                </div>
                <div className="ml-2 flex-shrink-0 flex">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(shift.status)}`}>
                    {shift.status}
                  </span>
                  {shift.workLocation === WORK_LOCATIONS.HOME && (
                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Homeoffice
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  {shift.assignedTo && (
                    <div className="text-sm text-gray-500">
                      Zugewiesen an: {shift.assignedTo}
                    </div>
                  )}
                </div>
                {showActions && (
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 space-x-2">
                    {shift.status === SHIFT_STATUS.OPEN && (
                      <>
                        <button
                          onClick={() => handleApply(shift.id)}
                          className="inline-flex items-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/80"
                        >
                          Bewerben
                        </button>
                        {canManageShifts(userRole) && (
                          <button
                            onClick={() => handleAssign(shift.id)}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            Zuweisen
                          </button>
                        )}
                      </>
                    )}
                    {shift.status === SHIFT_STATUS.ASSIGNED && canManageShifts(userRole) && (
                      <button
                        onClick={() => handleCancel(shift.id)}
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                      >
                        Absagen
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {shift.conflicts?.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  Konflikte gefunden: {shift.conflicts.join(', ')}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      
      {/* Series Application Button */}
      {showActions && shifts.filter(s => s.status === SHIFT_STATUS.OPEN).length > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => setShowSeriesModal(true)}
            className="inline-flex items-center rounded-md bg-brand-secondary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-secondary/80"
          >
            Serienbewerbung ({shifts.filter(s => s.status === SHIFT_STATUS.OPEN).length} Dienste)
          </button>
        </div>
      )}
      
      {/* Series Application Modal */}
      <SeriesApplicationModal
        isOpen={showSeriesModal}
        onClose={() => setShowSeriesModal(false)}
        shifts={shifts}
      />
    </div>
  );
}
