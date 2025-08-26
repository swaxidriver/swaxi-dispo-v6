import React from 'react'
import { screen, renderWithProviders } from './testUtils'
import Administration from '../pages/Administration'

jest.mock('../components/ShiftTemplateManager', () => {
  const Comp = () => <div data-testid="shift-template-manager">ShiftTemplateManager</div>
  Comp.displayName = 'MockShiftTemplateManager'
  return Comp
})
jest.mock('../components/RoleManagement', () => {
  const Comp = () => <div data-testid="role-management">RoleManagement</div>
  Comp.displayName = 'MockRoleManagement'
  return Comp
})

// Provide minimal ShiftTemplateContext
jest.mock('../contexts/ShiftTemplateContext', () => {
  const React = require('react')
  const Ctx = React.createContext({ templates: [] })
  const ShiftTemplateProvider = ({ children }) => <Ctx.Provider value={{ templates: [] }}>{children}</Ctx.Provider>
  return { ShiftTemplateProvider, default: Ctx }
})

describe('Administration page', () => {
  it('renders heading and child managers', () => {
    renderWithProviders(<Administration />)
    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByTestId('shift-template-manager')).toBeInTheDocument()
    expect(screen.getByTestId('role-management')).toBeInTheDocument()
  })
})
