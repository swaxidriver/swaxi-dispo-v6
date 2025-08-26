import { render, screen, fireEvent } from '@testing-library/react'

import { AuthProvider } from '../contexts/AuthContext'
import { useAuth } from '../contexts/useAuth'

// Helper component to expose context for assertions
function Probe() {
  const { user, login, logout, mockUsers } = useAuth()
  return (
    <div>
      <div data-testid="user">{user ? user.role : 'none'}</div>
      <button onClick={() => login('admin')}>login-admin</button>
      <button onClick={() => login('analyst')}>login-analyst</button>
      <button onClick={logout}>logout</button>
      <div data-testid="roles">{Object.keys(mockUsers).join(',')}</div>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('logs in and persists user, then restores on reload', () => {
    const { unmount } = render(<AuthProvider><Probe /></AuthProvider>)
    fireEvent.click(screen.getByText('login-admin'))
    expect(screen.getByTestId('user').textContent).toBe('admin')
    // persisted
    expect(JSON.parse(localStorage.getItem('user')).role).toBe('admin')

    // Remount to simulate reload
    unmount()
    const { getByTestId } = render(<AuthProvider><Probe /></AuthProvider>)
    expect(getByTestId('user').textContent).toBe('admin')
  })

  test('logout clears user and storage', () => {
    render(<AuthProvider><Probe /></AuthProvider>)
    fireEvent.click(screen.getByText('login-analyst'))
    expect(screen.getByTestId('user').textContent).toBe('analyst')
    fireEvent.click(screen.getByText('logout'))
    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(localStorage.getItem('user')).toBeNull()
  })
})
