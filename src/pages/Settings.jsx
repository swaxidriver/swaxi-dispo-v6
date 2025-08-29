import { useState } from 'react'

import { useI18n } from '../hooks/useI18n'
import { useSettings } from '../hooks/useSettings'
import { useTheme } from '../contexts/useTheme'
import { ROLES } from '../utils/constants'
import ThemeSelector from '../components/ThemeSelector'

export default function Settings() {
  const { t, language, setLanguage, availableLanguages } = useI18n()
  const { settings, updateSetting, resetSettings, exportSettings } = useSettings()
  const { setThemeMode } = useTheme()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
  }
  
  const handleThemeChange = (newTheme) => {
    updateSetting('theme', newTheme)
    // Update the actual theme context
    setThemeMode(newTheme)
  }
  
  const handleRoleChange = (newRole) => {
    updateSetting('role', newRole)
  }
  
  const handleResetDemo = () => {
    if (showResetConfirm) {
      // Reset demo data (simplified - in real app would clear all demo data)
      resetSettings()
      setShowResetConfirm(false)
      // Could dispatch an event to reset other demo data
      window.dispatchEvent(new CustomEvent('swaxi-reset-demo'))
    } else {
      setShowResetConfirm(true)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-text">{t('settingsTitle')}</h1>
        
        {/* Language Settings */}
        <div className="bg-surface border border-border shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-text">{t('language')}</h2>
          <div className="space-y-2">
            {availableLanguages.map((lang) => (
              <label key={lang} className="flex items-center">
                <input
                  type="radio"
                  name="language"
                  value={lang}
                  checked={language === lang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="mr-3 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span className="text-sm font-medium">
                  {lang === 'de' ? 'Deutsch' : 'English'} ({lang})
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Theme Settings */}
        <div className="bg-surface border border-border shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-text">{t('theme')}</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted">Choose your preferred theme appearance</p>
            <ThemeSelector />
          </div>
        </div>
        
        {/* Role Settings */}
        <div className="bg-surface border border-border shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-text">{t('role')}</h2>
          <p className="text-sm text-muted mb-4">
            Demo: Changes role for testing role-gated UI features
          </p>
          <select
            value={settings.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="block w-full rounded-md border-border py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm bg-surface text-text"
          >
            {Object.values(ROLES).map((role) => (
              <option key={role} value={role}>
                {t(role)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Time Format Settings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('timeFormat')}</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="timeFormat"
                value="24h"
                checked={settings.timeFormat === '24h'}
                onChange={(e) => updateSetting('timeFormat', e.target.value)}
                className="mr-3 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm font-medium">{t('format24h')}</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="timeFormat"
                value="ampm"
                checked={settings.timeFormat === 'ampm'}
                onChange={(e) => updateSetting('timeFormat', e.target.value)}
                className="mr-3 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm font-medium">{t('formatAmPm')}</span>
            </label>
          </div>
        </div>
        
        {/* Conflict Rules Settings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('conflictRules')}</h2>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.conflictRulesEnabled}
              onChange={(e) => updateSetting('conflictRulesEnabled', e.target.checked)}
              className="mr-3 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-sm font-medium">Enable conflict detection</span>
          </label>
        </div>
        
        {/* Autosave Interval Settings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('autosaveInterval')}</h2>
          <select
            value={settings.autosaveInterval}
            onChange={(e) => updateSetting('autosaveInterval', parseInt(e.target.value))}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-[var(--color-primary)] focus:outline-none focus:ring-[var(--color-primary)] sm:text-sm"
          >
            <option value={15}>{t('interval15s')}</option>
            <option value={30}>{t('interval30s')}</option>
            <option value={60}>{t('interval60s')}</option>
          </select>
        </div>
        
        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-4">{t('dangerZone')}</h2>
          <div className="space-y-4">
            <div>
              <button
                onClick={exportSettings}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 mr-4"
              >
                {t('exportJson')}
              </button>
              <span className="text-sm text-gray-600">Export current settings as JSON</span>
            </div>
            <div>
              <button
                onClick={handleResetDemo}
                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  showResetConfirm 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {showResetConfirm ? 'Confirm Reset' : t('resetDemoData')}
              </button>
              {showResetConfirm && (
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="ml-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('cancel')}
                </button>
              )}
              <div className="text-sm text-red-600 mt-1">
                {showResetConfirm ? 'This will reset all settings to defaults' : 'Reset all demo data and settings'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}