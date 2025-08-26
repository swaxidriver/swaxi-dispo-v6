import React from 'react'
import { screen, fireEvent, renderWithProviders, act } from './testUtils'
import TestPage from '../pages/TestPage'

// Mock sharePointService methods used
jest.mock('../services/sharePointService', () => ({
  sharePointService: {
    isSharePointAvailable: jest.fn().mockResolvedValue(false),
    getShifts: jest.fn().mockResolvedValue([]),
    logAudit: jest.fn().mockResolvedValue(undefined)
  }
}))

// Mock useShifts from context to supply createShift and testConnection
jest.mock('../contexts/ShiftContext', () => {
  const React = require('react')
  const Ctx = React.createContext()
  const mockValue = {
    state: { dataSource: 'localStorage', isOnline: false, shifts: [] },
    testConnection: jest.fn(),
    createShift: jest.fn().mockResolvedValue({ id: 'test-id' })
  }
  const useShifts = () => React.useContext(Ctx)
  function ShiftProvider({ children }) {
    return <Ctx.Provider value={mockValue}>{children}</Ctx.Provider>
  }
  return { ShiftProvider, default: Ctx, useShifts }
})

describe('TestPage', () => {
  it('renders heading and status blocks', () => {
    renderWithProviders(<TestPage />)
    expect(screen.getByText('Hybrid-Modus Testen')).toBeInTheDocument()
    expect(screen.getByText(/Datenquelle/)).toBeInTheDocument()
  })

  it('runs tests and shows results', async () => {
    renderWithProviders(<TestPage />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '🚀 Alle Tests starten' }))
    })
    expect(screen.getByText('Test-Ergebnisse')).toBeInTheDocument()
  })
})
