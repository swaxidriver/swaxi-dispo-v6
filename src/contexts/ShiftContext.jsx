/* global process */
/* eslint-disable import/order */
import { createContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react'

import { getShiftRepository } from '../repository/repositoryFactory'
import { generateShiftTemplates, checkShiftConflicts } from '../utils/shifts'
import { validateShiftArray } from '../utils/validation'

import { SHIFT_STATUS } from '../utils/constants'
import { initialState, shiftReducer, normalizeGeneratedShifts } from './ShiftContextCore'
import { enqueue, drain as drainQueue, peekQueue } from '../services/offlineQueue'
import { useShiftTemplates } from './useShiftTemplates'

const ShiftContext = createContext(null)

export function ShiftProvider({ children, disableAsyncBootstrap = false, heartbeatMs = 15000, enableAsyncInTests = false, repositoryOverride = null }) {
  const isTestEnv = typeof process !== 'undefined' && process.env?.JEST_WORKER_ID !== undefined
  const tplContext = useShiftTemplates() || {}
  const memoTemplates = useMemo(() => tplContext.templates || [], [tplContext.templates])

  const [state, dispatch] = useReducer(shiftReducer, initialState)

  const repoRef = useRef(null)
  if (!repoRef.current) repoRef.current = repositoryOverride || getShiftRepository()
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    // 1. Synchronous localStorage bootstrap for legacy tests & offline continuity.
  try {
      const lsShifts = localStorage.getItem('shifts')
      if (lsShifts) {
        const parsed = JSON.parse(lsShifts)
        if (Array.isArray(parsed) && parsed.length) {
          const withConflicts = parsed.map(s => ({
            ...s,
            conflicts: checkShiftConflicts(s, parsed.filter(o => o.id !== s.id), [])
          }))
          dispatch({ type: 'INIT_SHIFTS', payload: withConflicts })
      bootstrappedRef.current = true
        }
      }
      const pApps = localStorage.getItem('applications')
      if (pApps) {
        try { dispatch({ type: 'INIT_APPLICATIONS', payload: JSON.parse(pApps) }) } catch { /* ignore */ }
      }
      const pNotes = localStorage.getItem('notifications')
      if (pNotes) {
        try { dispatch({ type: 'INIT_NOTIFICATIONS', payload: JSON.parse(pNotes) }) } catch { /* ignore */ }
      }
    } catch { /* ignore */ }

    // 2. Async repository load if no shifts were loaded yet.
    async function bootstrapAsync() {
      if (cancelled || disableAsyncBootstrap || (isTestEnv && !enableAsyncInTests)) return
  if (bootstrappedRef.current) return // already bootstrapped from LS
      try {
        let loadedShifts = []
        try {
          loadedShifts = await repoRef.current.list()
        } catch { /* repository unavailable */ }
        if (!loadedShifts || !loadedShifts.length) {
          const base = generateShiftTemplates(new Date())
          loadedShifts = normalizeGeneratedShifts(base)
        }
        loadedShifts = loadedShifts.map(s => ({ ...s, conflicts: checkShiftConflicts(s, loadedShifts.filter(o => o.id !== s.id), state.applications) }))
        // Validate (dev/test only logs); filter out obviously malformed entries to prevent downstream errors.
        const validated = validateShiftArray(loadedShifts)
        const env = (typeof process !== 'undefined' && process?.env?.NODE_ENV) || 'development'
        if (validated.length !== loadedShifts.length && env !== 'production') {
          console.warn(`ShiftProvider: filtered ${loadedShifts.length - validated.length} malformed shift(s).`)
        }
        if (!cancelled) dispatch({ type: 'INIT_SHIFTS', payload: validated })
      } catch { /* swallow */ }
    }
    bootstrapAsync()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Heartbeat ping to repository to update online status (skipped in tests unless explicitly enabled)
  useEffect(() => {
    if ((isTestEnv && !enableAsyncInTests) || heartbeatMs <= 0) return () => {}
    let stopped = false
    let handle
    async function loop() {
      if (stopped) return
      try {
        const res = await repoRef.current?.ping?.()
        if (typeof res === 'boolean' && res !== state.isOnline) {
          dispatch({ type: 'SET_ONLINE', payload: res })
        }
      } catch {
        if (state.isOnline) dispatch({ type: 'SET_ONLINE', payload: false })
      } finally {
        handle = setTimeout(loop, heartbeatMs)
      }
    }
    loop()
    return () => { stopped = true; if (handle) clearTimeout(handle) }
  }, [heartbeatMs, state.isOnline, isTestEnv, enableAsyncInTests])

  useEffect(() => {
    if (state.shifts.length) localStorage.setItem('shifts', JSON.stringify(state.shifts))
  }, [state.shifts])
  useEffect(() => { localStorage.setItem('applications', JSON.stringify(state.applications)) }, [state.applications])
  useEffect(() => { localStorage.setItem('notifications', JSON.stringify(state.notifications)) }, [state.notifications])

  useEffect(() => {
    if (!memoTemplates.length) return
    const today = new Date()
    const additions = []
    for (let i = 0; i < 10; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const iso = date.toISOString().slice(0, 10)
      memoTemplates.forEach(t => {
        if (t.days?.length) {
          const weekdayMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
          const code = weekdayMap[date.getDay()]
          if (!t.days.includes(code)) return
        }
        const id = `${iso}_${t.name}`
        if (!state.shifts.find(s => s.id === id)) {
          additions.push({
            id,
            date,
            type: t.name,
            start: t.startTime,
            end: t.endTime,
            status: SHIFT_STATUS.OPEN,
            assignedTo: null,
            workLocation: 'office',
            conflicts: [],
          })
        }
      })
    }
    if (additions.length) {
      // compute conflicts for new additions only vs existing + new additions
      const combined = [...state.shifts, ...additions]
      const enriched = additions.map(s => ({
        ...s,
        conflicts: checkShiftConflicts(s, combined.filter(o => o.id !== s.id), state.applications)
      }))
      enriched.forEach(s => dispatch({ type: 'ADD_SHIFT', payload: s }))
    }
  }, [memoTemplates, state.shifts, state.applications])

  // Listen for feedback events to surface as notifications
  useEffect(() => {
    function onFeedback(e) {
      const f = e.detail
      if (!f) return
      dispatch({ type: 'ADD_NOTIFICATION', payload: { id: 'fb_evt_' + f.id, title: 'Feedback', message: f.category + ' gespeichert', timestamp: new Date().toLocaleString(), isRead: false } })
    }
    window.addEventListener('swaxi-feedback', onFeedback)
    return () => window.removeEventListener('swaxi-feedback', onFeedback)
  }, [])

  const applyToShift = useCallback((shiftId, userId) => {
    const app = { id: `${shiftId}_${userId}`, shiftId, userId, ts: Date.now() }
    dispatch({ type: 'ADD_APPLICATION', payload: app })
    // Recalculate conflicts for that shift
    const target = state.shifts.find(s => s.id === shiftId)
    if (target) {
      const updated = { ...target, conflicts: checkShiftConflicts(target, state.shifts.filter(o => o.id !== target.id), [...state.applications, app]) }
      dispatch({ type: 'UPDATE_SHIFT', payload: updated })
    }
    dispatch({ type: 'ADD_NOTIFICATION', payload: { id: `apply_${shiftId}_${Date.now()}`, title: 'Bewerbung eingereicht', message: `Shift ${shiftId} Bewerbung gespeichert`, timestamp: new Date().toLocaleString(), isRead: false } })
    // Fire & forget repository persistence
    // Repository persistence with offline queue fallback
    const attempt = repoRef.current?.applyToShift?.(shiftId, userId)
    if (attempt && typeof attempt.then === 'function') {
      attempt.catch(() => {
        enqueue({ id: `apply_${app.id}`, type: 'apply', payload: { shiftId, userId }, ts: Date.now() })
      })
    } else {
      // If no promise returned treat as failure for offline queue
      enqueue({ id: `apply_${app.id}`, type: 'apply', payload: { shiftId, userId }, ts: Date.now() })
    }
  }, [state.shifts, state.applications])

  const applyToSeries = useCallback((shiftIds, userId) => {
    if (!shiftIds.length) return
    const apps = shiftIds.map(id => ({ id: `${id}_${userId}`, shiftId: id, userId, ts: Date.now() }))
    dispatch({ type: 'ADD_SERIES_APPLICATION', payload: apps })
    // Bulk conflict recompute for involved shifts
    shiftIds.forEach(id => {
      const target = state.shifts.find(s => s.id === id)
      if (target) {
        const updated = { ...target, conflicts: checkShiftConflicts(target, state.shifts.filter(o => o.id !== target.id), [...state.applications, ...apps]) }
        dispatch({ type: 'UPDATE_SHIFT', payload: updated })
      }
    })
    dispatch({ type: 'ADD_NOTIFICATION', payload: { id: `apply_series_${Date.now()}`, title: 'Serienbewerbung', message: `${shiftIds.length} Bewerbungen gespeichert`, timestamp: new Date().toLocaleString(), isRead: false } })
  }, [state.shifts, state.applications])

  const updateShiftStatus = useCallback((shiftId, status) => {
    const shift = state.shifts.find(s => s.id === shiftId)
    if (shift) {
      const updated = { ...shift, status }
      updated.conflicts = checkShiftConflicts(updated, state.shifts.filter(o => o.id !== updated.id), state.applications)
      dispatch({ type: 'UPDATE_SHIFT', payload: updated })
    }
  }, [state.shifts, state.applications])

  const assignShift = useCallback((shiftId, user) => {
    dispatch({ type: 'ASSIGN_SHIFT', payload: { id: shiftId, user } })
    const target = state.shifts.find(s => s.id === shiftId)
    if (target) {
      const updated = { ...target, status: SHIFT_STATUS.ASSIGNED, assignedTo: user }
      updated.conflicts = checkShiftConflicts(updated, state.shifts.filter(o => o.id !== updated.id), state.applications)
      dispatch({ type: 'UPDATE_SHIFT', payload: updated })
      dispatch({ type: 'ADD_NOTIFICATION', payload: { id: `${shiftId}_${Date.now()}`, title: 'Shift assigned', message: `${user} wurde Dienst zugewiesen`, timestamp: new Date().toLocaleString(), isRead: false } })
      const attempt = repoRef.current?.assignShift?.(shiftId, user)
      if (attempt && typeof attempt.then === 'function') {
        attempt.catch(() => {
          enqueue({ id: `assign_${shiftId}_${user}`, type: 'assign', payload: { shiftId, user }, ts: Date.now() })
        })
      } else {
        enqueue({ id: `assign_${shiftId}_${user}`, type: 'assign', payload: { shiftId, user }, ts: Date.now() })
      }
    }
  }, [state.shifts, state.applications])

  const markNotificationRead = useCallback((id) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id }), [])
  const markAllNotificationsRead = useCallback(() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' }), [])

  const createShift = useCallback((partial) => {
    // partial: { date, type, start, end, workLocation? }
    const date = partial.date instanceof Date ? partial.date : new Date(partial.date)
    const id = `${date.toISOString().slice(0,10)}_${partial.type}`
    if (state.shifts.find(s => s.id === id)) {
      return { ok: false, reason: 'duplicate' }
    }
    const shift = { id, date, type: partial.type, start: partial.start, end: partial.end, status: SHIFT_STATUS.OPEN, assignedTo: null, workLocation: partial.workLocation || 'office', conflicts: [], pendingSync: false }
    shift.conflicts = checkShiftConflicts(shift, state.shifts, state.applications)
    dispatch({ type: 'ADD_SHIFT', payload: shift })
    dispatch({ type: 'ADD_NOTIFICATION', payload: { id: `create_${id}_${Date.now()}`, title: 'Dienst erstellt', message: `${partial.type} ${partial.start}-${partial.end}`, timestamp: new Date().toLocaleString(), isRead: false } })
    // Optimistic persistence
    const attempt = repoRef.current?.create?.(shift)
    if (attempt && typeof attempt.then === 'function') {
      attempt
        .then(saved => {
          dispatch({ type: 'UPDATE_SHIFT', payload: { ...shift, ...saved, pendingSync: false } })
        })
        .catch(() => {
          // queue create action and flag pendingSync
          enqueue({ id: `create_${id}`, type: 'create', payload: { shift }, ts: Date.now() })
          dispatch({ type: 'UPDATE_SHIFT', payload: { ...shift, pendingSync: true } })
        })
    } else {
      enqueue({ id: `create_${id}`, type: 'create', payload: { shift }, ts: Date.now() })
      dispatch({ type: 'UPDATE_SHIFT', payload: { ...shift, pendingSync: true } })
    }
    return { ok: true, id }
  }, [state.shifts, state.applications])

  // Drain offline queue when coming online
  useEffect(() => {
    if (!state.isOnline) return
    const current = peekQueue()
    if (!current.length) return
    let stopped = false
    ;(async () => {
      await drainQueue(async (act) => {
        if (stopped) return
        if (act.type === 'create') {
          try {
            const saved = await repoRef.current?.create?.(act.payload.shift)
            if (saved) {
              dispatch({ type: 'UPDATE_SHIFT', payload: { ...act.payload.shift, ...saved, pendingSync: false } })
            } else {
              dispatch({ type: 'UPDATE_SHIFT', payload: { ...act.payload.shift, pendingSync: false } })
            }
          } catch {
            // If still failing, re-enqueue for later
            enqueue(act)
          }
        } else if (act.type === 'apply') {
          try { await repoRef.current?.applyToShift?.(act.payload.shiftId, act.payload.userId) } catch { enqueue(act) }
        } else if (act.type === 'assign') {
          try { await repoRef.current?.assignShift?.(act.payload.shiftId, act.payload.user) } catch { enqueue(act) }
        }
      })
    })()
    return () => { stopped = true }
  }, [state.isOnline, state.shifts])

  const value = useMemo(() => ({
    state,
    shifts: state.shifts,
    dispatch,
  isOnline: state.isOnline,
    applyToShift,
    applyToSeries,
    updateShiftStatus,
    assignShift,
    createShift,
    markNotificationRead,
    markAllNotificationsRead,
  getOpenShifts: () => state.shifts.filter(s => s.status === SHIFT_STATUS.OPEN),
  getConflictedShifts: () => state.shifts.filter(s => s.conflicts?.length),
  }), [state, applyToShift, applyToSeries, updateShiftStatus, assignShift, createShift, markNotificationRead, markAllNotificationsRead])

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
}

export { ShiftContext }
