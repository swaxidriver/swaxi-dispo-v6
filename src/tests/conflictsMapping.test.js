import { CONFLICT_LABELS, describeConflicts, firstConflictTooltip } from '../utils/conflicts'

describe('conflicts mapping utilities', () => {
  test('CONFLICT_LABELS keys stable', () => {
    expect(Object.keys(CONFLICT_LABELS).sort()).toEqual(['ASSIGNMENT_COLLISION','DOUBLE_APPLICATION','LOCATION_MISMATCH','TIME_OVERLAP'].sort())
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
})
