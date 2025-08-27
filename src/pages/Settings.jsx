import { useState } from 'react'

import { CogIcon, GlobeAltIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/useToast'

// Build metadata injected by Vite define() (see vite.config.js)
/* global __APP_VERSION__, __APP_COMMIT__ */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
const APP_COMMIT = typeof __APP_COMMIT__ !== 'undefined' ? __APP_COMMIT__ : 'local'

function LanguageSection({ currentLang, onLanguageChange }) {
  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <GlobeAltIcon className="h-5 w-5 mr-2" aria-hidden="true" />
        Sprache / Language
      </h3>
      <div className="space-y-3">
        {languages.map((lang) => (
          <label key={lang.code} className="flex items-center">
            <input
              type="radio"
              name="language"
              value={lang.code}
              checked={currentLang === lang.code}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-3 text-sm text-gray-700 flex items-center">
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
              {lang.code !== 'de' && (
                <span className="ml-2 text-xs text-gray-500">(Bald verfügbar)</span>
              )}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-sm text-gray-600">
        Die Spracheinstellung wird lokal gespeichert und beim nächsten Besuch wiederhergestellt.
      </p>
    </div>
  )
}

function AppInfoSection() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <InformationCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
        App-Informationen
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Version:</span>
          <span className="text-sm font-mono text-gray-900">{APP_VERSION}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Build:</span>
          <span className="text-sm font-mono text-gray-900">{APP_COMMIT}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Built:</span>
          <span className="text-sm text-gray-900">{new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const { addToast } = useToast()
  const [currentLang, setCurrentLang] = useState(() => {
    // Load from localStorage, fallback to 'de'
    return localStorage.getItem('lang') || 'de'
  })

  const handleLanguageChange = (newLang) => {
    setCurrentLang(newLang)
    localStorage.setItem('lang', newLang)
    
    // Update html lang attribute
    document.documentElement.lang = newLang
    
    // Show feedback to user
    if (newLang === 'de') {
      addToast('Sprache auf Deutsch eingestellt', { type: 'success' })
    } else {
      addToast('Language set to ' + newLang + ' (coming soon)', { type: 'info' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <CogIcon className="h-6 w-6 mr-3" aria-hidden="true" />
          Einstellungen
        </h1>
        <p className="mt-2 text-gray-600">
          Verwalten Sie Ihre Anwendungseinstellungen und Präferenzen.
        </p>
      </div>

      <div className="space-y-6">
        <LanguageSection 
          currentLang={currentLang} 
          onLanguageChange={handleLanguageChange} 
        />
        <AppInfoSection />
      </div>
    </div>
  )
}