import { useEffect } from 'react'

import { useShifts } from '../../../contexts/useShifts'
import { useFormState, useAsyncOperation } from '../../../hooks'
import { toast, createValidator, validationRules, formPersistence, createFormSubmitHandler } from '../../../ui/form-validation'

// Validation rules for the shift form
const shiftValidator = createValidator({
  date: [validationRules.required, validationRules.date],
  type: validationRules.required,
  start: [validationRules.required, validationRules.time],
  end: [validationRules.required, validationRules.time],
  workLocation: (value) => validationRules.required(value, 'Arbeitsort')
})

export default function CreateShiftModal({ isOpen, onClose, defaultDate }) {
  const { createShift } = useShifts()
  
  // Initialize form state with persistence
  const initialState = formPersistence.load('create-shift', {
    date: defaultDate ? new Date(defaultDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    type: 'evening',
    start: '17:45',
    end: '21:45',
    workLocation: ''
  })
  
  const formState = useFormState(initialState, shiftValidator)
  
  // Create async operation for shift creation with retry capability
  const createShiftOp = useAsyncOperation(
    async (shiftData) => {
      const res = createShift(shiftData)
      if (!res.ok) {
        if (res.reason === 'duplicate') {
          throw new Error('Dienst existiert bereits')
        } else if (res.reason === 'workLocation') {
          throw new Error('Arbeitsort erforderlich')
        } else {
          throw new Error('Fehler beim Erstellen des Dienstes')
        }
      }
      return res
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      onSuccess: () => {
        formPersistence.clear('create-shift')
        localStorage.removeItem('swaxi-unsaved-work')
        onClose()
      }
    }
  )
  
  // Enhanced submit handler with toast notifications
  const handleSubmit = createFormSubmitHandler(
    formState,
    createShiftOp.execute,
    {
      persistKey: 'create-shift',
      successMessage: 'Dienst erfolgreich erstellt!',
      clearOnSuccess: true,
      onSuccess: () => {
        localStorage.removeItem('swaxi-unsaved-work')
        onClose()
      }
    }
  )
  
  // Persist form state on changes
  useEffect(() => {
    if (isOpen) {
      formPersistence.save('create-shift', formState.values)
    }
  }, [formState.values, isOpen])
  
  // Mark unsaved work for autosave recovery
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('swaxi-unsaved-work', '1')
      return () => {
        // Only clear if form was successfully submitted
        if (!createShiftOp.isLoading && !createShiftOp.error) {
          localStorage.removeItem('swaxi-unsaved-work')
        }
      }
    }
  }, [isOpen, createShiftOp.isLoading, createShiftOp.error])

  if (!isOpen) return null

  const getFieldError = (fieldName) => {
    return formState.touched[fieldName] && formState.errors[fieldName]
  }

  const getFieldClasses = (fieldName) => {
    const baseClasses = "w-full border rounded px-2 py-1"
    const hasError = getFieldError(fieldName)
    return hasError 
      ? `${baseClasses} border-red-500 focus:border-red-500 focus:ring-red-200`
      : `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-blue-200`
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start justify-center pt-24 z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-md shadow p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Neuen Dienst erstellen</h2>
        
        {/* Global form error */}
        {createShiftOp.error && !createShiftOp.isLoading && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200" role="alert">
            <div className="flex items-center justify-between">
              <span>{createShiftOp.error}</span>
              {createShiftOp.canRetry && (
                <button
                  type="button"
                  onClick={createShiftOp.retry}
                  className="ml-2 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded border border-red-300"
                >
                  Wiederholen
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <label htmlFor="shift-date" className="text-sm font-medium">
            Datum <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <input 
            id="shift-date" 
            type="date" 
            value={formState.values.date} 
            onChange={formState.handleInputChange}
            onBlur={formState.handleBlur}
            name="date"
            className={getFieldClasses('date')}
            aria-describedby={getFieldError('date') ? "date-error" : undefined}
          />
          {getFieldError('date') && (
            <div id="date-error" className="text-sm text-red-600 mt-1" role="alert">
              {getFieldError('date')}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <label htmlFor="shift-type" className="text-sm font-medium">
            Typ <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <select 
            id="shift-type" 
            value={formState.values.type} 
            onChange={formState.handleInputChange}
            onBlur={formState.handleBlur}
            name="type"
            className={getFieldClasses('type')}
            aria-describedby={getFieldError('type') ? "type-error" : undefined}
          >
            <option value="">-- bitte wählen --</option>
            <option value="early">Früh</option>
            <option value="evening">Abend</option>
            <option value="night">Nacht</option>
          </select>
          {getFieldError('type') && (
            <div id="type-error" className="text-sm text-red-600 mt-1" role="alert">
              {getFieldError('type')}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="shift-start" className="text-sm font-medium">
              Start <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input 
              id="shift-start" 
              type="time" 
              value={formState.values.start} 
              onChange={formState.handleInputChange}
              onBlur={formState.handleBlur}
              name="start"
              className={getFieldClasses('start')}
              aria-describedby={getFieldError('start') ? "start-error" : undefined}
            />
            {getFieldError('start') && (
              <div id="start-error" className="text-sm text-red-600 mt-1" role="alert">
                {getFieldError('start')}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="shift-end" className="text-sm font-medium">
              Ende <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input 
              id="shift-end" 
              type="time" 
              value={formState.values.end} 
              onChange={formState.handleInputChange}
              onBlur={formState.handleBlur}
              name="end"
              className={getFieldClasses('end')}
              aria-describedby={getFieldError('end') ? "end-error" : undefined}
            />
            {getFieldError('end') && (
              <div id="end-error" className="text-sm text-red-600 mt-1" role="alert">
                {getFieldError('end')}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="shift-location" className="text-sm font-medium">
            Arbeitsort <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <select 
            id="shift-location" 
            value={formState.values.workLocation} 
            onChange={formState.handleInputChange}
            onBlur={formState.handleBlur}
            name="workLocation"
            className={getFieldClasses('workLocation')}
            aria-describedby={getFieldError('workLocation') ? "workLocation-error" : undefined}
          >
            <option value="">-- bitte wählen --</option>
            <option value="office">Büro</option>
            <option value="home">Homeoffice</option>
          </select>
          {getFieldError('workLocation') && (
            <div id="workLocation-error" className="text-sm text-red-600 mt-1" role="alert">
              {getFieldError('workLocation')}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <button 
            type="button" 
            onClick={() => {
              formPersistence.clear('create-shift')
              localStorage.removeItem('swaxi-unsaved-work')
              onClose()
            }}
            className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button 
            type="submit" 
            disabled={createShiftOp.isLoading || !formState.isValid}
            className="btn btn-primary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createShiftOp.isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            Speichern
          </button>
        </div>
      </form>
    </div>
  )
}
