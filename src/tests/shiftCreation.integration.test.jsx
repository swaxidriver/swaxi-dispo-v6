import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShiftProvider } from '../contexts/ShiftContext'
import { ShiftTemplateProvider } from '../contexts/ShiftTemplateContext'
import AuthContext from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import ShiftTemplateManager from '../components/ShiftTemplateManager'
import Dashboard from '../pages/Dashboard'

// Integration test: user adds a template ("Schicht anlegen") and a corresponding shift is generated for today
// based on the template's selected weekday.

describe('Shift creation via template (Schicht anlegen)', () => {
  const fixedNow = new Date('2025-08-26T09:00:00Z') // Tuesday -> weekday code 'Tu'

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(fixedNow)
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  beforeEach(() => {
    localStorage.clear()
  })

  function renderApp() {
    return render(
      <AuthContext.Provider value={{ user: { name: 'Admin', role: 'admin' }}}>
        <ThemeProvider>
          <ShiftTemplateProvider>
            <ShiftProvider>
              <div>
                <ShiftTemplateManager />
                <Dashboard />
              </div>
            </ShiftProvider>
          </ShiftTemplateProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    )
  }

  it('generates a shift for today after adding a template including today\'s weekday', async () => {
    renderApp()

    // Fill template form
    fireEvent.change(screen.getByPlaceholderText('Template Name'), { target: { value: 'TestTemplate' } })
    const timeInputs = screen.getAllByDisplayValue('')
    fireEvent.change(timeInputs[0], { target: { value: '10:00' } })
    fireEvent.change(timeInputs[1], { target: { value: '11:00' } })

    // Select weekday 'Tu' (Tuesday)
    fireEvent.click(screen.getByRole('button', { name: 'Tu' }))

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Add Template' }))

    // After adding template, ShiftContext effect should create new shift(s) including one with 10:00-11:00 today
    await waitFor(() => {
      expect(screen.getAllByText(/10:00-11:00/).length).toBeGreaterThan(0)
    })
  })
})
