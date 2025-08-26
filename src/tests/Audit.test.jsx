import React from 'react'
import { screen, fireEvent, renderWithProviders } from './testUtils'
import Audit from '../pages/Audit'

describe('Audit page', () => {
  it('renders heading and all logs initially', () => {
    renderWithProviders(<Audit />)
    expect(screen.getByText('Audit')).toBeInTheDocument()
    expect(screen.getByText('Schicht erstellt')).toBeInTheDocument()
    expect(screen.getByText('Fahrzeugstatus geändert')).toBeInTheDocument()
    expect(screen.getByText('Urlaubsantrag eingereicht')).toBeInTheDocument()
  })

  it('filters by type', () => {
    renderWithProviders(<Audit />)
    fireEvent.change(screen.getByDisplayValue('Alle Aktivitäten'), { target: { value: 'create' } })
    expect(screen.getByText('Schicht erstellt')).toBeInTheDocument()
    expect(screen.queryByText('Fahrzeugstatus geändert')).toBeNull()
  })
})
