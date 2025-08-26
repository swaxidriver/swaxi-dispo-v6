import { useState, useContext } from 'react'

import AuthContext from '../contexts/AuthContext'
import { useFeedback } from '../contexts/useFeedback'

export default function FeedbackModal() {
  const { isOpen, close, addFeedback, exportJson } = useFeedback()
  const auth = useContext(AuthContext)
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [submitted, setSubmitted] = useState(false)
  if (!isOpen) return null
  const submit = (e) => {
    e.preventDefault()
    const res = addFeedback(message, { category, user: auth?.user })
    if (res.ok) {
      setSubmitted(true)
      setMessage('')
      setCategory('general')
      setTimeout(() => setSubmitted(false), 3000)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div className="bg-white rounded shadow max-w-lg w-full p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 id="feedback-title" className="text-lg font-semibold">Feedback geben</h2>
          <button onClick={close} aria-label="Schließen" className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="fb-category" className="block text-sm font-medium text-gray-700">Kategorie</label>
            <select id="fb-category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm">
              <option value="general">Allgemein</option>
              <option value="bug">Bug</option>
              <option value="idea">Idee</option>
              <option value="ui">UI/UX</option>
              <option value="performance">Performance</option>
            </select>
          </div>
          <div>
            <label htmlFor="fb-message" className="block text-sm font-medium text-gray-700">Nachricht</label>
            <textarea id="fb-message" value={message} onChange={e => setMessage(e.target.value)} rows={5} className="mt-1 block w-full rounded border-gray-300 shadow-sm" placeholder="Beschreibe dein Problem oder deine Idee..." />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">Eingeloggt als: {auth?.user?.role || 'Gast'}</div>
            <div className="space-x-2">
              <button type="button" onClick={exportJson} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Export</button>
              <button type="submit" disabled={!message.trim()} className="px-3 py-1 rounded bg-brand-accent text-white disabled:opacity-40">Senden</button>
            </div>
          </div>
          {submitted && <p className="text-green-600 text-sm">Danke! Feedback gespeichert.</p>}
        </form>
      </div>
    </div>
  )
}
