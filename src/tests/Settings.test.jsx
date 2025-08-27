import { render, screen, fireEvent } from '@testing-library/react'

import Settings from '../pages/Settings'
import { ToastProvider } from '../contexts/ToastContext'
import ToastContainer from '../components/ToastContainer'

// Mock global variables
/* global global */
global.__APP_VERSION__ = '0.3.0'
global.__APP_COMMIT__ = 'abc123'

const renderSettings = () => {
  return render(
    <ToastProvider>
      <Settings />
      <ToastContainer />
    </ToastProvider>
  )
}

describe('Settings Page', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset html lang attribute
    document.documentElement.lang = 'en'
  })

  it('renders settings page with title', () => {
    renderSettings()
    
    expect(screen.getByText('Einstellungen')).toBeInTheDocument()
    expect(screen.getByText('Verwalten Sie Ihre Anwendungseinstellungen und Präferenzen.')).toBeInTheDocument()
  })

  it('displays app version information', () => {
    renderSettings()
    
    expect(screen.getByText('App-Informationen')).toBeInTheDocument()
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content === '0.3.0'
    })).toBeInTheDocument()
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content === 'abc123'
    })).toBeInTheDocument()
  })

  it('shows language selection with German as default', () => {
    renderSettings()
    
    expect(screen.getByText('Sprache / Language')).toBeInTheDocument()
    
    const germanOption = screen.getByDisplayValue('de')
    const englishOption = screen.getByDisplayValue('en')
    
    expect(germanOption).toBeChecked()
    expect(englishOption).not.toBeChecked()
  })

  it('loads saved language preference from localStorage', () => {
    localStorage.setItem('lang', 'en')
    
    renderSettings()
    
    const englishOption = screen.getByDisplayValue('en')
    expect(englishOption).toBeChecked()
  })

  it('changes language and shows toast notification', () => {
    renderSettings()
    
    const englishOption = screen.getByDisplayValue('en')
    fireEvent.click(englishOption)
    
    expect(englishOption).toBeChecked()
    expect(localStorage.getItem('lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    
    // Check for toast notification
    expect(screen.getByText(/Language set to en/)).toBeInTheDocument()
  })

  it('changes to German and shows German toast notification', () => {
    localStorage.setItem('lang', 'en')
    
    renderSettings()
    
    const germanOption = screen.getByDisplayValue('de')
    fireEvent.click(germanOption)
    
    expect(germanOption).toBeChecked()
    expect(localStorage.getItem('lang')).toBe('de')
    expect(document.documentElement.lang).toBe('de')
    
    // Check for German toast notification
    expect(screen.getByText('Sprache auf Deutsch eingestellt')).toBeInTheDocument()
  })

  it('shows coming soon message for non-German languages', () => {
    renderSettings()
    
    expect(screen.getByText('(Bald verfügbar)')).toBeInTheDocument()
  })

  it('explains language persistence', () => {
    renderSettings()
    
    expect(screen.getByText(/Die Spracheinstellung wird lokal gespeichert/)).toBeInTheDocument()
  })
})