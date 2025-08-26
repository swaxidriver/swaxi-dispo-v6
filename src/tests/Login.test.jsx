/* eslint-disable import/order */
import { render, screen, fireEvent } from '@testing-library/react'
import Login from '../components/Login'

jest.mock('../contexts/useAuth', () => ({
  __esModule: true,
  useAuth: jest.fn()
}))

import { useAuth } from '../contexts/useAuth'

const mockLogin = jest.fn()
const mockLogout = jest.fn()
const mockUsers = {
  admin: { name: 'Admin', role: 'admin' },
  analyst: { name: 'Analyst', role: 'analyst' }
}

function setAuth(user = null) {
  useAuth.mockReturnValue({ user, login: mockLogin, logout: mockLogout, mockUsers })
}

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders role buttons when logged out and logs in on click', () => {
    setAuth(null)
    render(<Login />)
    const btn = screen.getByRole('button', { name: /Login as admin/i })
    fireEvent.click(btn)
    expect(mockLogin).toHaveBeenCalledWith('admin')
  })

  test('shows welcome and logout when user present', () => {
    setAuth({ name: 'Tester', role: 'admin' })
    render(<Login />)
    expect(screen.getByText(/Welcome, Tester/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }))
    expect(mockLogout).toHaveBeenCalled()
  })
})
