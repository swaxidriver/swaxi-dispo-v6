import { useState } from 'react'
import { toast, validationRules, createValidator, formPersistence } from '../ui/form-validation'
import { useFormState } from '../hooks'

// Create a validator for demo form
const demoValidator = createValidator({
  name: validationRules.required,
  email: [validationRules.required, validationRules.email],
  message: (value) => validationRules.minLength(10)(value, 'Nachricht')
})

export default function FormValidationDemo() {
  const formState = useFormState(
    formPersistence.load('demo-form', { name: '', email: '', message: '' }),
    demoValidator
  )
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Simulate form submission with potential failure
  const simulateSubmit = async (values) => {
    setIsSubmitting(true)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Randomly fail 30% of the time to demonstrate retry
    if (Math.random() < 0.3) {
      throw new Error('Netzwerkfehler: Verbindung unterbrochen')
    }
    
    return { success: true, id: Date.now() }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const isValid = formState.validate()
    if (!isValid) {
      toast.error('Bitte überprüfen Sie Ihre Eingaben')
      return
    }
    
    try {
      const result = await simulateSubmit(formState.values)
      toast.success('Formular erfolgreich übermittelt!')
      formPersistence.clear('demo-form')
      formState.reset()
    } catch (error) {
      toast.error(`Fehler: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Save form state on changes
  const handleChange = (e) => {
    formState.handleInputChange(e)
    formPersistence.save('demo-form', {
      ...formState.values,
      [e.target.name]: e.target.value
    })
  }
  
  const getFieldError = (fieldName) => {
    return formState.touched[fieldName] && formState.errors[fieldName]
  }

  const getFieldClasses = (fieldName) => {
    const baseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
    const hasError = getFieldError(fieldName)
    return hasError 
      ? `${baseClasses} border-red-500 focus:ring-red-200 focus:border-red-500`
      : `${baseClasses} border-gray-300 focus:ring-blue-200 focus:border-blue-500`
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Form Validation Demo</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Toast Notifications</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => toast.success('Das ist eine Erfolgsmeldung!')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Success Toast
          </button>
          <button 
            onClick={() => toast.error('Das ist eine Fehlermeldung!')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Error Toast
          </button>
          <button 
            onClick={() => toast.info('Das ist eine Info-Nachricht!')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Info Toast
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Enhanced Form with Validation</h2>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formState.values.name}
            onChange={handleChange}
            onBlur={formState.handleBlur}
            className={getFieldClasses('name')}
            aria-describedby={getFieldError('name') ? 'name-error' : undefined}
          />
          {getFieldError('name') && (
            <div id="name-error" className="mt-1 text-sm text-red-600" role="alert">
              {getFieldError('name')}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formState.values.email}
            onChange={handleChange}
            onBlur={formState.handleBlur}
            className={getFieldClasses('email')}
            aria-describedby={getFieldError('email') ? 'email-error' : undefined}
          />
          {getFieldError('email') && (
            <div id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {getFieldError('email')}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Nachricht <span className="text-red-500">*</span> (min. 10 Zeichen)
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formState.values.message}
            onChange={handleChange}
            onBlur={formState.handleBlur}
            className={getFieldClasses('message')}
            aria-describedby={getFieldError('message') ? 'message-error' : undefined}
          />
          {getFieldError('message') && (
            <div id="message-error" className="mt-1 text-sm text-red-600" role="alert">
              {getFieldError('message')}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !formState.isValid}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSubmitting ? 'Wird gesendet...' : 'Absenden'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              formState.reset()
              formPersistence.clear('demo-form')
              toast.info('Formular zurückgesetzt')
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Zurücksetzen
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
          <p className="font-medium">Demo Features:</p>
          <ul className="mt-2 space-y-1 text-gray-600">
            <li>• Inline-Validierung mit Fehlermeldungen</li>
            <li>• Toast-Benachrichtigungen für Erfolg/Fehler</li>
            <li>• Automatische Formular-Persistierung (localStorage)</li>
            <li>• Accessibility mit aria-live und role="alert"</li>
            <li>• 30% Chance auf simulierten Netzwerkfehler</li>
          </ul>
        </div>
      </form>
    </div>
  )
}