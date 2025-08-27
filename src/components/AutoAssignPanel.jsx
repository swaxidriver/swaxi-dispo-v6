import { useState } from 'react'

import { UserGroupIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useShifts } from '../contexts/useShifts'
import { useToast } from '../contexts/useToast'
import { canAssignShifts } from '../utils/constants'
import { useAuth } from '../contexts/useAuth'

export default function AutoAssignPanel() {
  const { state, runAutoAssign } = useShifts()
  const { addToast } = useToast()
  const { user } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const openShifts = state.shifts.filter(s => s.status === 'open' && !s.assignedTo)
  const canRun = user && canAssignShifts(user.role)

  const handleAutoAssign = async () => {
    if (!canRun || isRunning) return

    setIsRunning(true)
    addToast('Starte automatische Zuweisung...', { type: 'info' })

    try {
      const result = runAutoAssign()
      setLastResult(result)

      if (result.assigned > 0) {
        addToast(
          `${result.assigned} von ${result.total} Diensten automatisch zugewiesen`, 
          { type: 'success' }
        )
      } else if (result.total === 0) {
        addToast('Keine offenen Dienste zum Zuweisen verfügbar', { type: 'info' })
      } else {
        addToast(
          `Keine Zuweisungen möglich (${result.total} offene Dienste haben Konflikte)`, 
          { type: 'warning' }
        )
      }
    } catch (error) {
      console.error('Auto-assign error:', error)
      addToast('Fehler bei der automatischen Zuweisung', { type: 'error' })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <UserGroupIcon className="h-5 w-5 mr-2" aria-hidden="true" />
        Automatische Zuweisung
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Offene Dienste:</span>
          <span className="text-sm font-medium text-gray-900">{openShifts.length}</span>
        </div>

        {lastResult && (
          <div className="p-3 rounded-md bg-gray-50">
            <div className="flex items-center">
              {lastResult.assigned > 0 ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              )}
              <div className="text-sm">
                <div className="font-medium">
                  Letzter Lauf: {lastResult.assigned} von {lastResult.total} zugewiesen
                </div>
                {lastResult.stats && (
                  <div className="text-gray-600 mt-1">
                    Erfolgsrate: {Math.round(lastResult.stats.assignmentRate * 100)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleAutoAssign}
          disabled={!canRun || isRunning || openShifts.length === 0}
          className={`
            w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium
            ${
              canRun && !isRunning && openShifts.length > 0
                ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }
          `}
          aria-label={
            !canRun 
              ? 'Keine Berechtigung für automatische Zuweisung'
              : openShifts.length === 0
              ? 'Keine offenen Dienste verfügbar'
              : 'Automatische Zuweisung starten'
          }
        >
          {isRunning ? 'Läuft...' : 'Automatisch zuweisen'}
        </button>

        {!canRun && (
          <p className="text-xs text-gray-500 text-center">
            Nur Administratoren und Chefs können automatische Zuweisungen durchführen.
          </p>
        )}

        <div className="text-xs text-gray-500">
          <p className="mb-2">Die automatische Zuweisung berücksichtigt:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Faire Verteilung der Arbeitsbelastung</li>
            <li>Standort-Kompatibilität (Büro/Home Office)</li>
            <li>Zeitkonflikte und Überschneidungen</li>
            <li>Bestehende Bewerbungen werden bevorzugt</li>
          </ul>
        </div>
      </div>
    </div>
  )
}