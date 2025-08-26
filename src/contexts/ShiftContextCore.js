import { SHIFT_STATUS } from '../utils/constants'

export const initialState = {
  shifts: [],
  applications: [],
  notifications: [],
  filters: { timeRange: 'all', status: 'all', location: 'all' },
  dataSource: 'localStorage',
  isOnline: false,
  lastSync: null,
}

export function buildShiftId(date, type) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.toISOString().slice(0, 10)}_${type}`
}

export function normalizeGeneratedShifts(raw) {
  return raw.map(s => ({
    id: buildShiftId(s.date, s.type),
    date: s.date,
    type: s.type,
    start: s.start,
    end: s.end,
    status: SHIFT_STATUS.OPEN,
    assignedTo: null,
    workLocation: 'office',
    conflicts: [],
  }))
}

export function shiftReducer(state, action) {
  switch (action.type) {
    case 'INIT_SHIFTS':
      return { ...state, shifts: action.payload }
    case 'SET_SHIFTS':
      return { ...state, shifts: action.payload }
    case 'ADD_SHIFT':
      return { ...state, shifts: [...state.shifts, action.payload] }
    case 'UPDATE_SHIFT':
      return { ...state, shifts: state.shifts.map(s => (s.id === action.payload.id ? { ...s, ...action.payload } : s)) }
    case 'ASSIGN_SHIFT': {
      const { id, user } = action.payload
      return { ...state, shifts: state.shifts.map(s => s.id === id ? { ...s, status: 'assigned', assignedTo: user } : s) }
    }
    case 'INIT_APPLICATIONS':
      return { ...state, applications: action.payload }
    case 'ADD_APPLICATION':
      return { ...state, applications: [...state.applications, action.payload] }
    case 'ADD_SERIES_APPLICATION':
      return { ...state, applications: [...state.applications, ...action.payload] }
    case 'INIT_NOTIFICATIONS':
      return { ...state, notifications: action.payload }
    case 'UPDATE_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] }
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload }
    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map(n => (n.id === action.payload ? { ...n, isRead: true } : n)) }
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map(n => ({ ...n, isRead: true })) }
    case 'DELETE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) }
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload }
    default:
      return state
  }
}
