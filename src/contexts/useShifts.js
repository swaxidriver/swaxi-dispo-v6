import { useContext } from 'react'

import { ShiftContext } from './ShiftContext'

export function useShifts() {
  const ctx = useContext(ShiftContext)
  if (!ctx) throw new Error('useShifts must be used within ShiftProvider')
  return ctx
}
