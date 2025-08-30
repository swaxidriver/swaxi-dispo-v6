import { toMinutes, computeDuration, overlaps, computeShiftConflicts, minutesBetweenShifts, isShortTurnaround, CONFLICT_CODES } from '../utils/shifts'

describe('Time & Conflict Utilities', () => {
  test('toMinutes parses HH:MM', () => {
    expect(toMinutes('00:00')).toBe(0)
    expect(toMinutes('23:59')).toBe(23*60+59)
    expect(Number.isNaN(toMinutes('24:00'))).toBe(true)
  })
  test('computeDuration normal and over-midnight', () => {
    expect(computeDuration('06:00','14:00')).toBe(8*60)
    expect(computeDuration('22:00','06:00')).toBe(8*60)
  })
  test('overlaps handles over-midnight segments', () => {
    expect(overlaps('22:00','06:00','05:00','07:00')).toBe(true) // tail overlap
    expect(overlaps('22:00','06:00','07:00','09:00')).toBe(false)
  })
  test('computeShiftConflicts TIME_OVERLAP detection', () => {
    const a = { id:'A', start:'22:00', end:'06:00', assignedTo:null, status:'open', workLocation:'office' }
    const b = { id:'B', start:'05:00', end:'09:00', assignedTo:null, status:'open', workLocation:'office' }
    const conflicts = computeShiftConflicts(a, [b], [])
    expect(conflicts).toContain('TIME_OVERLAP')
  })
  test('computeShiftConflicts DOUBLE_APPLICATION & ASSIGNMENT_COLLISION & LOCATION_MISMATCH', () => {
    const a = { id:'A', start:'08:00', end:'12:00', assignedTo:'User1', status:'assigned', workLocation:'office' }
    const b = { id:'B', start:'10:00', end:'14:00', assignedTo:'User1', status:'assigned', workLocation:'home' }
    const apps = [
      { id:'A_User1', shiftId:'A', userId:'User1' },
      { id:'B_User1', shiftId:'B', userId:'User1' }
    ]
    const conflictsA = computeShiftConflicts(a, [b], apps)
  expect(conflictsA).toEqual(expect.arrayContaining(['TIME_OVERLAP','ASSIGNMENT_COLLISION','LOCATION_MISMATCH']))
  })

  // New tests for short turnaround detection
  test('minutesBetweenShifts calculates gap correctly', () => {
    const shiftA = { id:'A', date:'2025-01-15', start:'22:00', end:'06:00' }
    const shiftB = { id:'B', date:'2025-01-15', start:'14:00', end:'18:00' }
    
    // Same day calculation
    expect(minutesBetweenShifts(shiftB, shiftA)).toBe(240) // 4 hours between 18:00 and 22:00
  })

  test('isShortTurnaround detects insufficient rest time', () => {
    const nightShift = { id:'A', date:'2025-01-15', start:'22:00', end:'06:00' }
    const morningShift = { id:'B', date:'2025-01-16', start:'08:00', end:'12:00' }
    
    // 2 hours rest is short turnaround (default is 8 hours)
    expect(isShortTurnaround(nightShift, morningShift)).toBe(true)
    
    // 10 hours rest is not short turnaround
    const afternoonShift = { id:'C', date:'2025-01-16', start:'16:00', end:'20:00' }
    expect(isShortTurnaround(nightShift, afternoonShift)).toBe(false)
  })

  test('computeShiftConflicts SHORT_TURNAROUND detection', () => {
    const nightShift = { 
      id:'A', 
      date:'2025-01-15', 
      start:'22:00', 
      end:'06:00', 
      assignedTo:'User1', 
      status:'assigned' 
    }
    const morningShift = { 
      id:'B', 
      date:'2025-01-16', 
      start:'08:00', 
      end:'12:00', 
      assignedTo:'User1', 
      status:'assigned' 
    }
    
    const conflicts = computeShiftConflicts(nightShift, [morningShift], [])
    expect(conflicts).toContain(CONFLICT_CODES.SHORT_TURNAROUND)
  })

  test('short turnaround not detected for different users', () => {
    const nightShift = { 
      id:'A', 
      date:'2025-01-15', 
      start:'22:00', 
      end:'06:00', 
      assignedTo:'User1', 
      status:'assigned' 
    }
    const morningShift = { 
      id:'B', 
      date:'2025-01-16', 
      start:'08:00', 
      end:'12:00', 
      assignedTo:'User2', 
      status:'assigned' 
    }
    
    const conflicts = computeShiftConflicts(nightShift, [morningShift], [])
    expect(conflicts).not.toContain(CONFLICT_CODES.SHORT_TURNAROUND)
  })

  test('short turnaround not detected for unassigned shifts', () => {
    const nightShift = { 
      id:'A', 
      date:'2025-01-15', 
      start:'22:00', 
      end:'06:00', 
      assignedTo:null, 
      status:'open' 
    }
    const morningShift = { 
      id:'B', 
      date:'2025-01-16', 
      start:'08:00', 
      end:'12:00', 
      assignedTo:null, 
      status:'open' 
    }
    
    const conflicts = computeShiftConflicts(nightShift, [morningShift], [])
    expect(conflicts).not.toContain(CONFLICT_CODES.SHORT_TURNAROUND)
  })
})
