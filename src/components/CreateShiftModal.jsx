import { useState, useEffect } from 'react'

import { useShifts } from '../contexts/useShifts'

export default function CreateShiftModal({ isOpen, onClose, defaultDate }) {
  const { createShift } = useShifts()
  const [date, setDate] = useState(defaultDate ? new Date(defaultDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10))
  const [type, setType] = useState('evening')
  const [start, setStart] = useState('17:45')
  const [end, setEnd] = useState('21:45')
  const [workLocation, setWorkLocation] = useState('')
  const [error, setError] = useState(null)
  // mark unsaved work flag for autosave recovery scenarios
  useEffect(() => {
    localStorage.setItem('swaxi-unsaved-work', '1')
    return () => { /* leave flag for recovery until explicit cancel or save */ }
  }, [])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    if (!date || !type || !start || !end || !workLocation) {
      setError('Alle Felder erforderlich (inkl. Arbeitsort)')
      return
    }
    const res = createShift({ date, type, start, end, workLocation })
    if (!res.ok) {
      if (res.reason === 'duplicate') {
        setError('Dienst existiert bereits')
      } else if (res.reason === 'workLocation') {
        setError('Arbeitsort erforderlich')
      }
      return
    }
    localStorage.removeItem('swaxi-unsaved-work')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start justify-center z-50" style={{ paddingTop: 'var(--space-xl)' }}>
      <form onSubmit={handleSubmit} className="bg-white rounded-md shadow w-full max-w-md flex flex-col" style={{ padding: 'var(--space-xl)', gap: 'var(--space-lg)' }}>
        <h2 className="text-lg font-semibold">Neuen Dienst erstellen</h2>
        {error && <div className="text-sm text-red-600" role="alert">{error}</div>}
        <div className="flex flex-col" style={{ gap: 'var(--space-xs)' }}>
          <label htmlFor="shift-date" className="text-sm font-medium">Datum</label>
          <input id="shift-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded" style={{ paddingLeft: 'var(--space-sm)', paddingRight: 'var(--space-sm)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }} />
        </div>
        <div className="flex flex-col" style={{ gap: 'var(--space-xs)' }}>
          <label htmlFor="shift-type" className="text-sm font-medium">Typ</label>
          <select id="shift-type" value={type} onChange={e => setType(e.target.value)} className="w-full border rounded" style={{ paddingLeft: 'var(--space-sm)', paddingRight: 'var(--space-sm)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}>
            <option value="early">Früh</option>
            <option value="evening">Abend</option>
            <option value="night">Nacht</option>
          </select>
        </div>
        <div className="grid grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
          <div className="flex flex-col" style={{ gap: 'var(--space-xs)' }}>
            <label htmlFor="shift-start" className="text-sm font-medium">Start</label>
            <input id="shift-start" type="time" value={start} onChange={e => setStart(e.target.value)} className="w-full border rounded" style={{ paddingLeft: 'var(--space-sm)', paddingRight: 'var(--space-sm)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }} />
          </div>
          <div className="flex flex-col" style={{ gap: 'var(--space-xs)' }}>
            <label htmlFor="shift-end" className="text-sm font-medium">Ende</label>
            <input id="shift-end" type="time" value={end} onChange={e => setEnd(e.target.value)} className="w-full border rounded" style={{ paddingLeft: 'var(--space-sm)', paddingRight: 'var(--space-sm)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }} />
          </div>
        </div>
        <div className="flex flex-col" style={{ gap: 'var(--space-xs)' }}>
          <label htmlFor="shift-location" className="text-sm font-medium">Arbeitsort <span className="text-red-600" aria-hidden="true">*</span></label>
          <select id="shift-location" value={workLocation} onChange={e => setWorkLocation(e.target.value)} className="w-full border rounded" style={{ paddingLeft: 'var(--space-sm)', paddingRight: 'var(--space-sm)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}>
            <option value="">-- bitte wählen --</option>
            <option value="office">Büro</option>
            <option value="home">Homeoffice</option>
          </select>
        </div>
        <div className="flex justify-end" style={{ gap: 'var(--space-sm)', paddingTop: 'var(--space-sm)' }}>
          <button type="button" onClick={onClose} className="rounded border text-sm" style={{ paddingLeft: 'var(--space-md)', paddingRight: 'var(--space-md)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}>Abbrechen</button>
          <button type="submit" className="btn btn-primary text-sm" style={{ paddingLeft: 'var(--space-md)', paddingRight: 'var(--space-md)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}>Speichern</button>
        </div>
      </form>
    </div>
  )
}
