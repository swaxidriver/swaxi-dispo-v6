import { createContext, useReducer, useEffect } from 'react'

import { useLocalStorage } from '../hooks'

// Simple i18n dictionary as suggested in docs
const I18N_DICT = {
  de: {
    // Navigation
    overview: 'Übersicht',
    calendar: 'Kalender', 
    administration: 'Verwaltung',
    audit: 'Audit',
    settings: 'Einstellungen',
    test: '🧪 Test',
    
    // Settings page
    settingsTitle: 'Einstellungen',
    language: 'Sprache',
    theme: 'Design',
    role: 'Rolle',
    timeFormat: 'Zeitformat',
    conflictRules: 'Konfliktregeln',
    autosaveInterval: 'Autospeichern-Intervall',
    dangerZone: 'Gefahrenbereich',
    
    // Theme options
    light: 'Hell',
    dark: 'Dunkel', 
    system: 'System',
    
    // Time format options
    format24h: '24h',
    formatAmPm: 'AM/PM',
    
    // Roles
    admin: 'Administrator',
    chief: 'Einsatzleiter',
    disponent: 'Disponent',
    analyst: 'Analyst',
    
    // Actions
    save: 'Speichern',
    cancel: 'Abbrechen',
    reset: 'Zurücksetzen',
    export: 'Exportieren',
    resetDemoData: 'Demo-Daten zurücksetzen',
    exportJson: 'JSON exportieren',
    
    // Other common strings
    reload: 'Neu laden',
    updateAvailable: 'Neue Version verfügbar',
    loading: 'Laden...',
    
    // Intervals
    seconds: 'Sekunden',
    interval15s: '15 Sekunden',
    interval30s: '30 Sekunden', 
    interval60s: '60 Sekunden',
  },
  en: {
    // Navigation
    overview: 'Overview',
    calendar: 'Calendar',
    administration: 'Administration', 
    audit: 'Audit',
    settings: 'Settings',
    test: '🧪 Test',
    
    // Settings page
    settingsTitle: 'Settings',
    language: 'Language',
    theme: 'Theme',
    role: 'Role',
    timeFormat: 'Time Format',
    conflictRules: 'Conflict Rules',
    autosaveInterval: 'Autosave Interval',
    dangerZone: 'Danger Zone',
    
    // Theme options
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    
    // Time format options
    format24h: '24h',
    formatAmPm: 'AM/PM',
    
    // Roles
    admin: 'Administrator',
    chief: 'Chief',
    disponent: 'Dispatcher',
    analyst: 'Analyst',
    
    // Actions
    save: 'Save',
    cancel: 'Cancel', 
    reset: 'Reset',
    export: 'Export',
    resetDemoData: 'Reset Demo Data',
    exportJson: 'Export JSON',
    
    // Other common strings
    reload: 'Reload',
    updateAvailable: 'New version available',
    loading: 'Loading...',
    
    // Intervals
    seconds: 'seconds',
    interval15s: '15 seconds',
    interval30s: '30 seconds',
    interval60s: '60 seconds',
  }
}

const I18nContext = createContext()

const initialState = {
  language: 'de', // Default to German as specified
  dictionary: I18N_DICT
}

function i18nReducer(state, action) {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    default:
      return state
  }
}

export function I18nProvider({ children }) {
  const [storedLanguage, setStoredLanguage] = useLocalStorage('swaxi.settings.language', 'de')
  const [state, dispatch] = useReducer(i18nReducer, {
    ...initialState,
    language: storedLanguage
  })
  
  // Save language changes to localStorage (only when language changes)
  useEffect(() => {
    setStoredLanguage(state.language)
  }, [state.language, setStoredLanguage])
  
  const setLanguage = (language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language })
  }
  
  // Translation helper function - returns key if translation not found (fallback behavior)
  const t = (key) => {
    const translation = state.dictionary[state.language]?.[key]
    return translation || key
  }
  
  const value = {
    language: state.language,
    setLanguage,
    t,
    availableLanguages: Object.keys(state.dictionary)
  }
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export { I18nContext }