import { shiftReducer, initialState } from '../contexts/ShiftContextCore'

describe('shiftReducer', () => {
  it('returns state for unknown action', () => {
    const state = { ...initialState, shifts: [{ id: 'a', status: 'open' }] }
    const next = shiftReducer(state, { type: 'NOOP' })
    expect(next).toBe(state) // unchanged reference indicates default branch returns original state
  })

  it('adds a shift', () => {
    const state = { ...initialState, shifts: [] }
    const shift = { id: 's1', status: 'open' }
    const next = shiftReducer(state, { type: 'ADD_SHIFT', payload: shift })
    expect(next.shifts).toHaveLength(1)
    expect(next.shifts[0]).toEqual(shift)
  })

  it('updates a shift', () => {
    const state = { ...initialState, shifts: [{ id: 's1', status: 'open', assignedTo: null }] }
    const next = shiftReducer(state, { type: 'UPDATE_SHIFT', payload: { id: 's1', status: 'assigned', assignedTo: 'u1' } })
    expect(next.shifts[0].status).toBe('assigned')
    expect(next.shifts[0].assignedTo).toBe('u1')
  })

  it('assigns a shift (ASSIGN_SHIFT)', () => {
    const state = { ...initialState, shifts: [{ id: 's1', status: 'open', assignedTo: null }] }
    const next = shiftReducer(state, { type: 'ASSIGN_SHIFT', payload: { id: 's1', user: 'alice' } })
    expect(next.shifts[0].status).toBe('assigned')
    expect(next.shifts[0].assignedTo).toBe('alice')
  })
})
