import { useState, useRef, useEffect } from 'react';

import { useShifts } from '../contexts/useShifts';
import { useAuth } from '../contexts/useAuth';
import { SHIFT_STATUS } from '../utils/constants';

export default function SeriesApplicationModal({ isOpen, onClose, shifts = [] }) {
  const { applyToSeries } = useShifts();
  const auth = useAuth(); // may be undefined in isolated tests
  const [selectedShifts, setSelectedShifts] = useState([]);
  // Preserve legacy default "current-user" to keep existing tests stable
  const [userId] = useState(auth?.user?.id || 'current-user');

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
  const availableShifts = shifts.filter(shift => shift.status === SHIFT_STATUS.OPEN);

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
      <div className="relative top-20 mx-auto border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" style={{ padding: 'var(--space-xl)' }} role="document">
        <div style={{ marginTop: 'var(--space-md)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
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

          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <p id="series-modal-desc" className="text-sm text-gray-600" style={{ marginBottom: 'var(--space-md)' }}>
              Bewerben Sie sich für mehrere Dienste gleichzeitig. Wählen Sie die gewünschten Dienste aus oder nutzen Sie die Schnellauswahl.
            </p>
            
            <div className="flex flex-wrap" style={{ gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              <button
                onClick={() => selectAllSameType('evening')}
                className="text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                style={{ paddingLeft: 'var(--space-md)', paddingRight: 'var(--space-md)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}
              >
                Alle Abend-Dienste
              </button>
              <button
                onClick={() => selectAllSameType('night')}
                className="text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200"
                style={{ paddingLeft: 'var(--space-md)', paddingRight: 'var(--space-md)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}
              >
                Alle Nacht-Dienste
              </button>
              <button
                onClick={() => selectAllSameType('early')}
                className="text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200"
                style={{ paddingLeft: 'var(--space-md)', paddingRight: 'var(--space-md)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}
              >
                Alle Früh-Dienste
              </button>
              <button
                onClick={selectAllWeekdays}
                className="text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
                style={{ paddingLeft: 'var(--space-md)', paddingRight: 'var(--space-md)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}
              >
                Mo-Do
              </button>
              <button
                onClick={selectAllWeekends}
                className="text-xs bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200"
                style={{ paddingLeft: 'var(--space-md)', paddingRight: 'var(--space-md)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}
              >
                Fr-So
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {availableShifts.length === 0 ? (
              <p className="text-center text-gray-500" style={{ paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-lg)' }}>Keine offenen Dienste verfügbar</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {availableShifts.map((shift) => (
                  <li key={shift.id} style={{ padding: 'var(--space-md)' }}>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedShifts.includes(shift.id)}
                        onChange={() => handleShiftToggle(shift.id)}
                        className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <div className="flex-1" style={{ marginLeft: 'var(--space-md)' }}>
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

          <div className="flex justify-between items-center" style={{ marginTop: 'var(--space-xl)' }}>
            <p className="text-sm text-gray-600">
              {selectedShifts.length} Dienst{selectedShifts.length !== 1 ? 'e' : ''} ausgewählt
            </p>
            <div className="flex" style={{ gap: 'var(--space-md)' }}>
              <button
                onClick={onClose}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                style={{ paddingLeft: 'var(--space-lg)', paddingRight: 'var(--space-lg)', paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-sm)' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedShifts.length === 0}
                className="btn btn-primary text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                style={{ paddingLeft: 'var(--space-lg)', paddingRight: 'var(--space-lg)', paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-sm)' }}
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
