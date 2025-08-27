import { useEffect, useRef } from 'react'

import { Transition } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/useToast'

const TOAST_ICONS = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon
}

const TOAST_STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

const TOAST_ICON_STYLES = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400'
}

function ToastItem({ toast, onDismiss }) {
  const Icon = TOAST_ICONS[toast.type] || InformationCircleIcon
  const toastRef = useRef(null)

  // Focus management for error toasts (important alerts)
  useEffect(() => {
    if (toast.type === 'error' && toastRef.current) {
      toastRef.current.focus()
    }
  }, [toast.type])

  return (
    <Transition
      show={toast.isVisible}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        ref={toastRef}
        className={`max-w-sm w-full border rounded-lg shadow-lg pointer-events-auto ${TOAST_STYLES[toast.type]}`}
        role={toast.type === 'error' ? 'alert' : 'status'}
        aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        tabIndex={toast.type === 'error' ? 0 : -1}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`h-6 w-6 ${TOAST_ICON_STYLES[toast.type]}`} aria-hidden="true" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium">
                {toast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => onDismiss(toast.id)}
                aria-label="Benachrichtigung schließen"
              >
                <span className="sr-only">Schließen</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Benachrichtigungen"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </div>
  )
}