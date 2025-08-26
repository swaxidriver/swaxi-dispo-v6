import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ActiveRoleBadge from '../components/ActiveRoleBadge'
import Navigation from '../components/Navigation'
import AuthContext from '../contexts/AuthContext'
import { ROLES } from '../utils/constants'

import { renderWithProviders, screen as sharedScreen } from './testUtils'

describe('ActiveRoleBadge', () => {
  function renderWithRole(role) {
    return render(
      <AuthContext.Provider value={{ user: role ? { id: role, role } : null }}>
        <ActiveRoleBadge />
      </AuthContext.Provider>
    )
  }

  it('renders nothing when no user', () => {
    const { container } = renderWithRole(null)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows role badge for each role', () => {
    Object.values(ROLES).forEach(role => {
      const { unmount } = renderWithRole(role)
      const badge = screen.getByTestId('active-role-badge')
      expect(badge).toHaveTextContent(role)
      unmount()
    })
  })

  it('shows admin only nav items and hides for analyst', () => {
    const adminNav = (
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    )
    renderWithProviders(adminNav, { authUser: { id: 'a', name: 'Admin', role: ROLES.ADMIN } })
    expect(sharedScreen.getByText('Verwaltung')).toBeInTheDocument()
    expect(sharedScreen.getByText('Audit')).toBeInTheDocument()
    expect(sharedScreen.getByTestId('active-role-badge')).toHaveTextContent(ROLES.ADMIN)

  // cleanup before next role
  cleanup()
  const analystNav = (
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    )
    // fresh render replaces DOM
  renderWithProviders(analystNav, { authUser: { id: 'x', name: 'Analyst', role: ROLES.ANALYST } })
    expect(sharedScreen.queryByText('Verwaltung')).toBeNull()
    expect(sharedScreen.queryByText('Audit')).toBeNull()
    expect(sharedScreen.getByTestId('active-role-badge')).toHaveTextContent(ROLES.ANALYST)
  })
})
