import { useState } from 'react';
import { useShifts } from '../contexts/ShiftContext';
import { SHIFT_STATUS } from '../utils/constants';

export default function SeriesApplicationModal({ isOpen, onClose, shifts = [] }) {
  const { applyToSeries } = useShifts();
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [userId] = useState('current-user'); // TODO: Get from auth context

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
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

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Bewerben Sie sich für mehrere Dienste gleichzeitig. Wählen Sie die gewünschten Dienste aus oder nutzen Sie die Schnellauswahl.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => selectAllSameType('evening')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
              >
                Alle Abend-Dienste
              </button>
              <button
                onClick={() => selectAllSameType('night')}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200"
              >
                Alle Nacht-Dienste
              </button>
              <button
                onClick={() => selectAllSameType('early')}
                className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200"
              >
                Alle Früh-Dienste
              </button>
              <button
                onClick={selectAllWeekdays}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
              >
                Mo-Do
              </button>
              <button
                onClick={selectAllWeekends}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200"
              >
                Fr-So
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {availableShifts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Keine offenen Dienste verfügbar</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {availableShifts.map((shift) => (
                  <li key={shift.id} className="p-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedShifts.includes(shift.id)}
                        onChange={() => handleShiftToggle(shift.id)}
                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                      />
                      <div className="ml-3 flex-1">
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

          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {selectedShifts.length} Dienst{selectedShifts.length !== 1 ? 'e' : ''} ausgewählt
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedShifts.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary/80 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
