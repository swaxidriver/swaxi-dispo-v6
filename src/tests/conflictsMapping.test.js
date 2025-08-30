import { CONFLICT_LABELS, describeConflicts, firstConflictTooltip, categorizeConflicts, getConflictSeverity, CONFLICT_SEVERITY } from '../utils/conflicts'

describe('conflicts mapping utilities', () => {
  test('CONFLICT_LABELS keys stable', () => {
    expect(Object.keys(CONFLICT_LABELS).sort()).toEqual(['ASSIGNMENT_COLLISION','DOUBLE_APPLICATION','LOCATION_MISMATCH','SHORT_TURNAROUND','TIME_OVERLAP'].sort())
  })
  test('describeConflicts maps known codes and preserves unknown', () => {
    const out = describeConflicts(['TIME_OVERLAP','FOO_UNKNOWN'])
    expect(out).toContain('Zeitüberlappung')
    expect(out).toContain('FOO_UNKNOWN')
  })
  test('firstConflictTooltip concatenates labels', () => {
    const tip = firstConflictTooltip(['ASSIGNMENT_COLLISION','TIME_OVERLAP'])
    expect(tip).toMatch(/Zuweisungs-Kollision/)
    expect(tip).toMatch(/Zeitüberlappung/)
  })
  test('empty arrays produce empty tooltip', () => {
    expect(firstConflictTooltip([])).toBe('')
  })

  // New tests for conflict severity
  test('getConflictSeverity returns correct severity levels', () => {
    expect(getConflictSeverity('TIME_OVERLAP')).toBe(CONFLICT_SEVERITY.BLOCKING)
    expect(getConflictSeverity('ASSIGNMENT_COLLISION')).toBe(CONFLICT_SEVERITY.BLOCKING)
    expect(getConflictSeverity('SHORT_TURNAROUND')).toBe(CONFLICT_SEVERITY.WARNING)
    expect(getConflictSeverity('DOUBLE_APPLICATION')).toBe(CONFLICT_SEVERITY.WARNING)
    expect(getConflictSeverity('LOCATION_MISMATCH')).toBe(CONFLICT_SEVERITY.WARNING)
    expect(getConflictSeverity('UNKNOWN_CODE')).toBe(CONFLICT_SEVERITY.WARNING) // default
  })

  test('categorizeConflicts separates warnings from blocking', () => {
    const conflicts = ['TIME_OVERLAP', 'SHORT_TURNAROUND', 'ASSIGNMENT_COLLISION', 'DOUBLE_APPLICATION']
    const { warnings, blocking } = categorizeConflicts(conflicts)
    
    expect(blocking).toEqual(['TIME_OVERLAP', 'ASSIGNMENT_COLLISION'])
    expect(warnings).toEqual(['SHORT_TURNAROUND', 'DOUBLE_APPLICATION'])
  })

  test('categorizeConflicts handles empty array', () => {
    const { warnings, blocking } = categorizeConflicts([])
    expect(warnings).toEqual([])
    expect(blocking).toEqual([])
  })
})
