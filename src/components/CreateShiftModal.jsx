import { useState, useEffect } from "react";

import { useShifts } from "../contexts/useShifts";

export default function CreateShiftModal({ isOpen, onClose, defaultDate }) {
  const { createShift } = useShifts();
  const [date, setDate] = useState(
    defaultDate
      ? new Date(defaultDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [type, setType] = useState("evening");
  const [start, setStart] = useState("17:45");
  const [end, setEnd] = useState("21:45");
  const [workLocation, setWorkLocation] = useState("");
  const [error, setError] = useState(null);
  // mark unsaved work flag for autosave recovery scenarios
  useEffect(() => {
    localStorage.setItem("swaxi-unsaved-work", "1");
    return () => {
      /* leave flag for recovery until explicit cancel or save */
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!date || !type || !start || !end || !workLocation) {
      setError("Alle Felder erforderlich (inkl. Arbeitsort)");
      return;
    }
    const res = createShift({ date, type, start, end, workLocation });
    if (!res.ok) {
      if (res.reason === "duplicate") {
        setError("Dienst existiert bereits");
      } else if (res.reason === "workLocation") {
        setError("Arbeitsort erforderlich");
      }
      return;
    }
    localStorage.removeItem("swaxi-unsaved-work");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start justify-center pt-24 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-md shadow p-6 w-full max-w-md space-y-4"
      >
        <h2 className="text-lg font-semibold">Neuen Dienst erstellen</h2>
        {error && (
          <div className="text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
        <div className="space-y-1">
          <label htmlFor="shift-date" className="text-sm font-medium">
            Datum
          </label>
          <input
            id="shift-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="shift-type" className="text-sm font-medium">
            Typ
          </label>
          <select
            id="shift-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="early">Früh</option>
            <option value="evening">Abend</option>
            <option value="night">Nacht</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="shift-start" className="text-sm font-medium">
              Start
            </label>
            <input
              id="shift-start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="shift-end" className="text-sm font-medium">
              Ende
            </label>
            <input
              id="shift-end"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="shift-location" className="text-sm font-medium">
            Arbeitsort{" "}
            <span className="text-red-600" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="shift-location"
            value={workLocation}
            onChange={(e) => setWorkLocation(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="">-- bitte wählen --</option>
            <option value="office">Büro</option>
            <option value="home">Homeoffice</option>
          </select>
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded border text-sm"
          >
            Abbrechen
          </button>
          <button type="submit" className="btn btn-primary text-sm px-3 py-1">
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}
