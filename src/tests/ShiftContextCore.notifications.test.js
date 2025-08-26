import { shiftReducer, initialState } from '../contexts/ShiftContextCore'

describe('shiftReducer notifications & filters', () => {
  it('adds a notification', () => {
    const note = { id: 'n1', title: 't', isRead: false }
    const next = shiftReducer(initialState, { type: 'ADD_NOTIFICATION', payload: note })
    expect(next.notifications).toHaveLength(1)
    expect(next.notifications[0]).toEqual(note)
  })

  it('marks one notification read', () => {
    const start = { ...initialState, notifications: [{ id: 'n1', isRead: false }, { id: 'n2', isRead: false }] }
    const next = shiftReducer(start, { type: 'MARK_NOTIFICATION_READ', payload: 'n1' })
    expect(next.notifications.find(n => n.id === 'n1').isRead).toBe(true)
    expect(next.notifications.find(n => n.id === 'n2').isRead).toBe(false)
  })

  it('marks all notifications read', () => {
    const start = { ...initialState, notifications: [{ id: 'n1', isRead: false }, { id: 'n2', isRead: false }] }
    const next = shiftReducer(start, { type: 'MARK_ALL_NOTIFICATIONS_READ' })
    expect(next.notifications.every(n => n.isRead)).toBe(true)
  })

  it('deletes a notification', () => {
    const start = { ...initialState, notifications: [{ id: 'n1' }, { id: 'n2' }] }
    const next = shiftReducer(start, { type: 'DELETE_NOTIFICATION', payload: 'n1' })
    expect(next.notifications).toHaveLength(1)
    expect(next.notifications[0].id).toBe('n2')
  })

  it('updates filters', () => {
    const next = shiftReducer(initialState, { type: 'UPDATE_FILTERS', payload: { status: 'open' } })
    expect(next.filters.status).toBe('open')
  })
})
