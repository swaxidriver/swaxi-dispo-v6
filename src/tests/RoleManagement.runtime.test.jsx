import React from 'react'
import { render, screen } from '@testing-library/react'

import RoleManagement from '../components/RoleManagement'

describe('RoleManagement runtime safety', () => {
  test('renders empty state when no users prop provided', () => {
    render(<RoleManagement />)
    expect(screen.getByTestId('role-management-root')).toBeInTheDocument()
    expect(screen.getByTestId('no-users')).toHaveTextContent('Keine Benutzer')
  })
})
