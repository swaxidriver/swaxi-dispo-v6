import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline'

import { describeConflicts } from '../utils/conflicts'
import { computeDuration } from '../utils/shifts'
import { logError } from '../utils/logger'

function ShiftDetailsModal({ shift, isOpen, onClose, onApply, onAssign, currentUser, userRole }) {
  const [isApplying, setIsApplying] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setIsApplying(false)
      setIsAssigning(false)
    }
  }, [isOpen])

  if (!shift) return null

  const duration = computeDuration(shift.start, shift.end)
  const durationHours = Math.floor(duration / 60)
  const durationMinutes = duration % 60
  const hasConflicts = shift.conflicts && shift.conflicts.length > 0
  const conflictDescriptions = hasConflicts ? describeConflicts(shift.conflicts) : []
  
  const canApply = shift.status === 'open' && !shift.assignedTo && currentUser
  const canAssign = userRole === 'admin' || userRole === 'chief'
  
  const handleApply = async () => {
    if (!canApply || isApplying) return
    setIsApplying(true)
    try {
      await onApply?.(shift.id, currentUser.id)
      onClose()
    } catch (error) {
      logError('Failed to apply to shift:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const handleAssign = async () => {
    if (!canAssign || isAssigning) return
    setIsAssigning(true)
    try {
      await onAssign?.(shift.id, currentUser.id)
      onClose()
    } catch (error) {
      logError('Failed to assign shift:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center" style={{ padding: 'var(--space-lg)' }}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all" style={{ padding: 'var(--space-xl)' }}>
                <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-lg)' }}>
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Schichtdetails
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                    onClick={onClose}
                    aria-label="Schließen"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div style={{ gap: 'var(--space-lg)' }} className="space-y-4">
                  {/* Basic Info */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <span className={`inline-flex text-xs font-semibold rounded-full ${getStatusBadgeClass(shift.status)}`} style={{ paddingLeft: 'var(--space-sm)', paddingRight: 'var(--space-sm)', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}>
                      {shift.status === 'open' ? 'Offen' : 
                       shift.status === 'assigned' ? 'Zugewiesen' : 
                       shift.status === 'pending' ? 'Ausstehend' : shift.status}
                    </span>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center" style={{ gap: 'var(--space-sm)' }}>
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(shift.date).toLocaleDateString('de-DE', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shift.start} - {shift.end} 
                        {duration > 0 && (
                          <span style={{ marginLeft: 'var(--space-sm)' }}>
                            ({durationHours}h {durationMinutes > 0 ? `${durationMinutes}m` : ''})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {shift.workLocation && (
                    <div className="flex items-center" style={{ gap: 'var(--space-sm)' }}>
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Arbeitsort</div>
                        <div className="text-sm text-gray-500">{shift.workLocation}</div>
                      </div>
                    </div>
                  )}

                  {/* Assigned User */}
                  {shift.assignedTo && (
                    <div className="flex items-center" style={{ gap: 'var(--space-sm)' }}>
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Zugewiesen an</div>
                        <div className="text-sm text-gray-500">{shift.assignedTo}</div>
                      </div>
                    </div>
                  )}

                  {/* Shift Type */}
                  {shift.type && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Schichttyp</span>
                      <span className="text-sm text-gray-900 capitalize">{shift.type}</span>
                    </div>
                  )}

                  {/* Conflicts */}
                  {hasConflicts && (
                    <div className="border-t" style={{ paddingTop: 'var(--space-lg)' }}>
                      <div className="text-sm font-medium text-red-600" style={{ marginBottom: 'var(--space-sm)' }}>Konflikte erkannt</div>
                      <ul style={{ gap: 'var(--space-xs)' }} className="space-y-1">
                        {conflictDescriptions.map((desc, index) => (
                          <li key={index} className="text-sm text-red-500 flex items-center">
                            <span className="w-2 h-2 bg-red-400 rounded-full" style={{ marginRight: 'var(--space-sm)' }}></span>
                            {desc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex" style={{ marginTop: 'var(--space-xl)', gap: 'var(--space-md)' }}>
                  {canApply && (
                    <button
                      type="button"
                      disabled={isApplying || hasConflicts}
                      onClick={handleApply}
                      className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ paddingLeft: 'var(--space-lg)', paddingRight: 'var(--space-lg)', paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-sm)' }}
                    >
                      {isApplying ? 'Bewerbe...' : 'Bewerben'}
                    </button>
                  )}
                  
                  {canAssign && shift.status === 'open' && (
                    <button
                      type="button"
                      disabled={isAssigning}
                      onClick={handleAssign}
                      className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-green-600 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ paddingLeft: 'var(--space-lg)', paddingRight: 'var(--space-lg)', paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-sm)' }}
                    >
                      {isAssigning ? 'Zuweisen...' : 'Zuweisen'}
                    </button>
                  )}

                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    style={{ paddingLeft: 'var(--space-lg)', paddingRight: 'var(--space-lg)', paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-sm)' }}
                    onClick={onClose}
                  >
                    Schließen
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default ShiftDetailsModal