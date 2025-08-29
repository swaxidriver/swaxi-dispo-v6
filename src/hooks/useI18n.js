import { useContext } from 'react'

import { I18nContext } from '../contexts/I18nContext'

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export default useI18n