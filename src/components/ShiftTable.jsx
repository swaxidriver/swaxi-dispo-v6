import React, { useState, useContext } from 'react'

import { useShifts } from '../contexts/useShifts'
import AuthContext from '../contexts/AuthContext'
import { SHIFT_STATUS, WORK_LOCATIONS } from '../utils/constants'
import { canTransition, STATUS } from '../domain/status'
import { computeDuration } from '../utils/shifts'
import { describeConflicts } from '../utils/conflicts'
import { canManageShifts } from '../utils/auth'

import _SeriesApplicationModal from './SeriesApplicationModal'

export default function ShiftTable({ shifts, showActions = true }) {
  const { applyToShift, assignShift, cancelShift } = useShifts();
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const auth = useContext(AuthContext)
  const userRole = auth?.user?.role || 'analyst'

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
    if(!auth?.user) return; // must be logged in
    applyToShift(shiftId, auth.user.name || auth.user.role);
  };

  const handleAssign = (shiftId) => {
    if(!auth?.user) return
    assignShift(shiftId, auth.user.name || auth.user.role)
  };

  const handleCancel = (shiftId) => {
    cancelShift?.(shiftId)
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {shifts.map((shift) => (
          <li key={shift.id}>
            <div style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-[var(--color-primary)] truncate">
                  {shift.date instanceof Date 
                    ? shift.date.toLocaleDateString('de-DE', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit' 
                      }) 
                    : shift.date} • {shift.start}-{shift.end}
                  <span className="text-xs text-gray-500" style={{ marginLeft: 'var(--space-2)' }}>({(computeDuration(shift.start, shift.end)/60).toFixed(1)}h)</span>
                </div>
                <div className="flex-shrink-0 flex" style={{ marginLeft: 'var(--space-2)' }}>
                  <span className={`inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(shift.status)}`} style={{ paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)' }}>
                    {shift.status}
                  </span>
                  {shift.workLocation === WORK_LOCATIONS.HOME && (
                    <span className="inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800" style={{ marginLeft: 'var(--space-2)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)' }}>
                      Homeoffice
                    </span>
                  )}
                </div>
              </div>
              
              <div className="sm:flex sm:justify-between" style={{ marginTop: 'var(--space-2)' }}>
                <div className="sm:flex">
                  {shift.assignedTo && (
                    <div className="text-sm text-gray-500">
                      Zugewiesen an: {shift.assignedTo}
                    </div>
                  )}
                </div>
                {showActions && (
                  <div className="flex items-center text-sm text-gray-500 sm:mt-0" style={{ marginTop: 'var(--space-2)', gap: 'var(--space-2)' }}>
                    {shift.status === SHIFT_STATUS.OPEN && (
                      <>
                        {(() => { return null })() /* placeholder to keep structure */}
                        {(() => {
                          const applyDisabled = !auth?.user || !canTransition(shift.status, STATUS.OPEN)
                          const applyReason = !auth?.user ? 'Anmeldung erforderlich' : (!canTransition(shift.status, STATUS.OPEN) ? 'Status erlaubt keine Bewerbung' : 'Für diesen Dienst bewerben')
                          return <button disabled={applyDisabled} onClick={() => !applyDisabled && handleApply(shift.id)} className={`inline-flex items-center rounded-md text-sm font-semibold shadow-sm ${applyDisabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'btn-primary'}`} title={applyReason} aria-label={applyReason} aria-disabled={applyDisabled} style={{ paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}>Bewerben</button>
                        })()}
                        {canManageShifts(userRole) && (() => {
                          const assignDisabled = !canTransition(shift.status, STATUS.ASSIGNED)
                          const assignReason = assignDisabled ? 'Status erlaubt keine Zuweisung' : 'Diesen Dienst einem Nutzer zuweisen'
                          return <button disabled={assignDisabled} onClick={() => !assignDisabled && handleAssign(shift.id)} className={`inline-flex items-center rounded-md text-sm font-semibold shadow-sm ring-1 ring-inset ${assignDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed ring-gray-200' : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'}`} title={assignReason} aria-label={assignReason} aria-disabled={assignDisabled} style={{ paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}>Zuweisen</button>
                        })()}
                      </>
                    )}
                    {shift.status === SHIFT_STATUS.ASSIGNED && canManageShifts(userRole) && (() => {
                      const cancelDisabled = !canTransition(shift.status, STATUS.CANCELLED)
                      const cancelReason = cancelDisabled ? 'Status erlaubt keine Absage' : 'Zuweisung für diesen Dienst zurücknehmen'
                      return <button disabled={cancelDisabled} onClick={() => !cancelDisabled && handleCancel(shift.id)} className={`inline-flex items-center rounded-md text-sm font-semibold shadow-sm ${cancelDisabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-500'}`} title={cancelReason} aria-label={cancelReason} aria-disabled={cancelDisabled} style={{ paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}>Absagen</button>
                    })()}
                  </div>
                )}
              </div>
              
              {shift.conflicts?.length > 0 && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded" style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)' }} aria-live="polite">
                  <strong>Konflikte:</strong> {describeConflicts(shift.conflicts).join(', ')}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      
      {/* Legend & Series Application Button */}
      <div className="bg-white border-t text-xs text-gray-500 space-y-1" style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}>
        <div className="flex flex-wrap" style={{ gap: 'var(--space-3)' }}>
          <span><strong>Legende:</strong></span>
          <span><span className="font-semibold">Zeitüberlappung</span> = Überschneidung in Zeit</span>
          <span><span className="font-semibold">Doppelte Bewerbung</span> = Bewerber in overlappenden Diensten</span>
          <span><span className="font-semibold">Zuweisungs-Kollision</span> = Person doppelt zugewiesen</span>
          <span><span className="font-semibold">Standort-Konflikt</span> = Unterschiedliche Orte gleichzeitig</span>
        </div>
      </div>
      {showActions && shifts.filter(s => s.status === SHIFT_STATUS.OPEN).length > 1 && (
        <div className="bg-gray-50 border-t border-gray-200" style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)' }}>
          <button
            onClick={() => setShowSeriesModal(true)}
            className="inline-flex items-center rounded-md text-sm font-semibold text-white shadow-sm bg-[var(--color-accent)] hover:opacity-90"
            style={{ paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}
          >
            Serienbewerbung ({shifts.filter(s => s.status === SHIFT_STATUS.OPEN).length} Dienste)
          </button>
        </div>
      )}
      
      {/* Series Application Modal */}
  <_SeriesApplicationModal
        isOpen={showSeriesModal}
        onClose={() => setShowSeriesModal(false)}
        shifts={shifts}
      />
    </div>
  );
}

export function ShiftTableComponent(props){
  return ShiftTable(props)
}
export { ShiftTable as ShiftTableDefault }
