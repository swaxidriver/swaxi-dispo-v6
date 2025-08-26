import { screen, fireEvent, render } from '@testing-library/react'

import { FeedbackProvider } from '../contexts/FeedbackContext'
import { useFeedback } from '../contexts/useFeedback'
import FeedbackModal from '../components/FeedbackModal'
import AuthContext from '../contexts/AuthContext'

function OpenButton() {
  const fb = useFeedback()
  return <button onClick={fb.open}>open-fb</button>
}

describe('FeedbackModal', () => {
  test('submits feedback and closes', () => {
    render(
      <AuthContext.Provider value={{ user: { id: 'u1', role: 'admin', name: 'Admin' } }}>
        <FeedbackProvider>
          <OpenButton />
          <FeedbackModal />
        </FeedbackProvider>
      </AuthContext.Provider>
    )
    fireEvent.click(screen.getByText('open-fb'))
    const textarea = screen.getByLabelText(/Nachricht/i)
    fireEvent.change(textarea, { target: { value: 'Ein Testfeedback' } })
  fireEvent.click(screen.getByRole('button', { name: /Senden/i }))
  // Modal should close (textarea gone) after submit
  expect(screen.queryByLabelText(/Nachricht/i)).toBeNull()
  // Feedback persisted to localStorage
  const stored = JSON.parse(localStorage.getItem('feedback_items') || '[]')
  expect(stored.length).toBeGreaterThan(0)
  })
})
