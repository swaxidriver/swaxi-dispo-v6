import { useState } from 'react'

import ShiftTemplateManager from '../components/ShiftTemplateManager'
import { ShiftTemplateProvider } from '../contexts/ShiftTemplateContext'
import RoleManagement from '../components/RoleManagement'
import AuditService from '../services/auditService'

function Administration() {
  const [showDangerZone, setShowDangerZone] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleClearAllData = () => {
    if (confirmText !== 'ALLE DATEN LÖSCHEN') {
      alert('Bitte geben Sie "ALLE DATEN LÖSCHEN" exakt ein, um fortzufahren.')
      return
    }

    const confirmed = confirm(
      'WARNUNG: Diese Aktion löscht ALLE Daten unwiderruflich:\n\n' +
      '• Alle Schichten\n' +
      '• Alle Audit-Logs\n' +
      '• Autosave-Snapshots\n' +
      '• Alle anderen gespeicherten Daten\n\n' +
      'Sind Sie sicher, dass Sie fortfahren möchten?'
    )

    if (confirmed) {
      try {
        // Clear shift data
        localStorage.removeItem('swaxi-dispo-state')
        
        // Clear audit logs
        AuditService.clearLogs()
        
        // Clear autosave snapshots
        localStorage.removeItem('swaxi-autosave-snapshots')
        localStorage.removeItem('swaxi-unsaved-work')
        
        // Clear other potential data
        localStorage.removeItem('swaxi-auth')
        localStorage.removeItem('swaxi-theme')
        
        // Log the clearing action before clearing (it will be immediately cleared)
        AuditService.logCurrentUserAction(
          'Alle Daten gelöscht (Danger Zone)',
          'Vollständige Löschung aller Anwendungsdaten durch Administrator',
          1
        )
        
        alert('Alle Daten wurden erfolgreich gelöscht. Die Seite wird neu geladen.')
        
        // Reload the page to reflect the changes
        window.location.reload()
      } catch (error) {
        console.error('Fehler beim Löschen der Daten:', error)
        alert('Fehler beim Löschen der Daten. Siehe Konsole für Details.')
      }
    }
    
    // Reset form
    setConfirmText('')
    setShowDangerZone(false)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Administration</h1>
      
      <ShiftTemplateProvider>
        <ShiftTemplateManager />
      </ShiftTemplateProvider>
      
      <div className="mt-8">
        <RoleManagement />
      </div>

      {/* Danger Zone */}
      <div className="mt-12 border border-red-200 rounded-lg p-6 bg-red-50">
        <h2 className="text-xl font-bold text-red-800 mb-4">⚠️ Danger Zone</h2>
        <p className="text-red-700 mb-4">
          Gefährliche Aktionen, die nicht rückgängig gemacht werden können.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => setShowDangerZone(!showDangerZone)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {showDangerZone ? 'Danger Zone schließen' : 'Alle Daten löschen...'}
          </button>
          
          {showDangerZone && (
            <div className="mt-4 p-4 border border-red-300 rounded bg-white">
              <h3 className="font-semibold text-red-800 mb-2">Alle Daten permanent löschen</h3>
              <p className="text-sm text-red-600 mb-4">
                Diese Aktion löscht alle Schichten, Audit-Logs, Snapshots und andere Anwendungsdaten unwiderruflich.
              </p>
              
              <div className="mb-4">
                <label htmlFor="confirmText" className="block text-sm font-medium text-red-700 mb-2">
                  Geben Sie "ALLE DATEN LÖSCHEN" ein, um fortzufahren:
                </label>
                <input
                  id="confirmText"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="block w-full border border-red-300 rounded-md px-3 py-2 focus:border-red-500 focus:ring-red-500"
                  placeholder="ALLE DATEN LÖSCHEN"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleClearAllData}
                  disabled={confirmText !== 'ALLE DATEN LÖSCHEN'}
                  className={`px-4 py-2 rounded-md ${
                    confirmText === 'ALLE DATEN LÖSCHEN'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  🗑️ Alle Daten permanent löschen
                </button>
                <button
                  onClick={() => {
                    setShowDangerZone(false)
                    setConfirmText('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Administration
