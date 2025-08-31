import { useState, useRef, useEffect, useMemo } from 'react';

import { useShifts } from '../contexts/useShifts';
import { useAuth } from '../contexts/useAuth';
import { SHIFT_STATUS } from '../utils/constants';
import { computeShiftConflicts } from '../utils/shifts';
import { describeConflicts } from '../utils/conflicts';

export default function SeriesApplicationModal({ isOpen, onClose, shifts = [] }) {
  const { applyToSeries, state } = useShifts();
  const auth = useAuth(); // may be undefined in isolated tests
  const [selectedShifts, setSelectedShifts] = useState([]);
  // Preserve legacy default "current-user" to keep existing tests stable
  const [userId] = useState(auth?.user?.id || 'current-user');

  const lastActiveRef = useRef(null);

  // Focus management: save last active element when modal opens, restore when closes
  useEffect(() => {
    if (isOpen) {
      lastActiveRef.current = document.activeElement;
    }
    // When modal closes, restore focus to last active element
    if (!isOpen && lastActiveRef.current) {
      // Use setTimeout to ensure focus after modal unmount
      setTimeout(() => {
        if (lastActiveRef.current && typeof lastActiveRef.current.focus === 'function') {
          lastActiveRef.current.focus();
        }
      }, 0);
    }
  }, [isOpen]);
  
  // Clear selections when modal closes (requirement: exiting mode clears selection)
  useEffect(() => {
    if (!isOpen) {
      setSelectedShifts([]);
    }
  }, [isOpen]);
  
  const availableShifts = shifts.filter(shift => shift.status === SHIFT_STATUS.OPEN);
  
  // Compute conflicts for selected shifts
  const conflictData = useMemo(() => {
    if (!selectedShifts.length) return { hasConflicts: false, conflictsByShift: {}, allConflictReasons: [] };
    
    const conflictsByShift = {};
    const allConflictReasons = new Set();
    
    // Get the actual shift objects for selected shifts
    const selectedShiftObjects = selectedShifts.map(id => availableShifts.find(s => s.id === id)).filter(Boolean);
    
    selectedShifts.forEach(shiftId => {
      const shift = availableShifts.find(s => s.id === shiftId);
      if (!shift) return;
      
      // Check conflicts against OTHER selected shifts only - this is what matters for multi-select
      // But only check shifts on the SAME DATE - different dates cannot have time conflicts
      const otherSelectedShifts = selectedShiftObjects.filter(s => {
        if (s.id === shift.id) return false; // Skip self
        
        // Compare dates - normalize both to strings to handle Date objects and string dates
        const shiftDate = shift.date instanceof Date ? shift.date.toISOString().slice(0, 10) : shift.date;
        const otherDate = s.date instanceof Date ? s.date.toISOString().slice(0, 10) : s.date;
        
        return shiftDate === otherDate; // Only check conflicts on same date
      });
      
      if (otherSelectedShifts.length > 0) {
        const conflicts = computeShiftConflicts(shift, otherSelectedShifts, state?.applications || []);
        
        if (conflicts.length > 0) {
          conflictsByShift[shiftId] = conflicts;
          conflicts.forEach(c => allConflictReasons.add(c));
        }
      }
    });
    
    return {
      hasConflicts: Object.keys(conflictsByShift).length > 0,
      conflictsByShift,
      allConflictReasons: Array.from(allConflictReasons)
    };
  }, [selectedShifts, availableShifts, state?.applications]);

  const handleShiftToggle = (shiftId) => {
    setSelectedShifts(prev => 
      prev.includes(shiftId) 
        ? prev.filter(id => id !== shiftId)
        : [...prev, shiftId]
    );
  };

  const handleSubmit = () => {
    if (selectedShifts.length > 0) {
      applyToSeries(selectedShifts, userId);
      onClose();
      setSelectedShifts([]);
    }
  };

  const selectAllSameType = (type) => {
    const sameTypeShifts = availableShifts
      .filter(shift => shift.type === type)
      .map(shift => shift.id);
    setSelectedShifts(prev => [...new Set([...prev, ...sameTypeShifts])]);
  };

  const selectAllWeekdays = () => {
    const weekdayShifts = availableShifts
      .filter(shift => {
        const date = new Date(shift.date);
        const day = date.getDay();
        return day >= 1 && day <= 4; // Monday to Thursday
      })
      .map(shift => shift.id);
    setSelectedShifts(prev => [...new Set([...prev, ...weekdayShifts])]);
  };

  const selectAllWeekends = () => {
    const weekendShifts = availableShifts
      .filter(shift => {
        const date = new Date(shift.date);
        const day = date.getDay();
        return day === 0 || day === 5 || day === 6; // Friday, Saturday, Sunday
      })
      .map(shift => shift.id);
    setSelectedShifts(prev => [...new Set([...prev, ...weekendShifts])]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true" aria-labelledby="series-modal-title" aria-describedby="series-modal-desc">
      <div className="relative mx-auto border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" style={{ top: 'var(--space-16)', padding: 'var(--space-4)' }} role="document">
        <div style={{ marginTop: 'var(--space-3)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 id="series-modal-title" className="text-lg font-medium text-gray-900">
              Serienbewerbung
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Schließen</span>
              ✕
            </button>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <p id="series-modal-desc" className="text-sm text-gray-600" style={{ marginBottom: 'var(--space-3)' }}>
              Bewerben Sie sich für mehrere Dienste gleichzeitig. Wählen Sie die gewünschten Dienste aus oder nutzen Sie die Schnellauswahl.
            </p>
            
            <div className="flex flex-wrap" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <button
                onClick={() => selectAllSameType('evening')}
                className="text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                style={{ paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-1)', paddingBottom: 'var(--space-1)' }}
              >
                Alle Abend-Dienste
              </button>
              <button
                onClick={() => selectAllSameType('night')}
                className="text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200"
                style={{ paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-1)', paddingBottom: 'var(--space-1)' }}
              >
                Alle Nacht-Dienste
              </button>
              <button
                onClick={() => selectAllSameType('early')}
                className="text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200"
                style={{ paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-1)', paddingBottom: 'var(--space-1)' }}
              >
                Alle Früh-Dienste
              </button>
              <button
                onClick={selectAllWeekdays}
                className="text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
                style={{ paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-1)', paddingBottom: 'var(--space-1)' }}
              >
                Mo-Do
              </button>
              <button
                onClick={selectAllWeekends}
                className="text-xs bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200"
                style={{ paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-1)', paddingBottom: 'var(--space-1)' }}
              >
                Fr-So
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {availableShifts.length === 0 ? (
              <p className="text-center text-gray-500" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>Keine offenen Dienste verfügbar</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {availableShifts.map((shift) => (
                  <li key={shift.id} style={{ padding: 'var(--space-3)' }}>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedShifts.includes(shift.id)}
                        onChange={() => handleShiftToggle(shift.id)}
                        className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <div className="flex-1" style={{ marginLeft: 'var(--space-3)' }}>
                        <div className="text-sm font-medium text-gray-900">
                          {shift.date instanceof Date 
                            ? shift.date.toLocaleDateString('de-DE', { 
                                weekday: 'short', 
                                day: '2-digit', 
                                month: '2-digit' 
                              }) 
                            : shift.date}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shift.type} • {shift.start}-{shift.end}
                        </div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Conflicts Display */}
          {conflictData.hasConflicts && (
            <div className="border border-red-200 bg-red-50 rounded-md" style={{ padding: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <div className="text-sm font-medium text-red-600 mb-2">Konflikte erkannt</div>
              <ul className="space-y-1">
                {describeConflicts(conflictData.allConflictReasons).map((desc, index) => (
                  <li key={index} className="text-sm text-red-500 flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    {desc}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-500 mt-2">
                Bitte Konflikte auflösen oder betroffene Dienste abwählen.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center" style={{ marginTop: 'var(--space-6)' }}>
            <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
              <span className="text-sm text-gray-600">Ausgewählt:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedShifts.length} Dienst{selectedShifts.length !== 1 ? 'e' : ''}
              </span>
            </div>
            <div className="flex" style={{ gap: 'var(--space-3)' }}>
              <button
                onClick={onClose}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedShifts.length === 0 || conflictData.hasConflicts}
                className="btn btn-primary text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}
              >
                Bewerben
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
