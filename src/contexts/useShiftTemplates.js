import { useContext } from 'react'
import { ShiftTemplateContext } from './ShiftTemplateContext'

export function useShiftTemplates() {
  const ctx = useContext(ShiftTemplateContext)
  if (!ctx) throw new Error('useShiftTemplates must be used within ShiftTemplateProvider')
  return ctx
}

export default useShiftTemplates