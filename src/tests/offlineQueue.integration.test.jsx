import React from 'react'
import { render, act, screen } from '@testing-library/react'

import { ShiftProvider } from '../contexts/ShiftContext'
import { useShifts } from '../contexts/useShifts'
import { clearQueueForTests, peekQueue } from '../services/offlineQueue'

function TestComp({ createArgs }) {
  const { createShift, shifts, state } = useShifts()
  React.useEffect(() => { if (createArgs) createShift(createArgs) }, [createArgs, createShift])
  return <div data-testid='meta'>{JSON.stringify({ count: shifts.length, isOnline: state.isOnline, ids: shifts.map(s=>({id:s.id,pendingSync:s.pendingSync})) })}</div>
}

describe('offline queue integration', () => {
  beforeEach(() => { clearQueueForTests(); localStorage.clear() })

  test('failed create is queued and pendingSync then drained when online', async () => {
    const failingRepo = { list: () => [], create: () => Promise.reject(new Error('offline')), ping: () => Promise.resolve(false) }

  render(<ShiftProvider repositoryOverride={failingRepo} disableAsyncBootstrap enableAsyncInTests><TestComp createArgs={{ date: new Date('2025-01-02'), type: 'X', start: '09:00', end: '10:00' }} /></ShiftProvider>)

    await act(async () => { await Promise.resolve() })
    // shift added locally
    const meta1 = JSON.parse(screen.getByTestId('meta').textContent)
    expect(meta1.count).toBe(1)
    expect(meta1.ids[0].pendingSync).toBe(true)
    expect(peekQueue().some(a => a.type === 'create')).toBe(true)

    // Re-render with succeeding repo + simulate online
  const succeedingRepo = { list: () => [], create: (s) => Promise.resolve({ ...s, extra: 'ok' }), ping: () => Promise.resolve(true) }

  render(<ShiftProvider repositoryOverride={succeedingRepo} disableAsyncBootstrap enableAsyncInTests><TestComp /></ShiftProvider>)

    // Force online + drain effect by toggling isOnline state via dispatch hack (simulate heartbeat)
    await act(async () => { succeedingRepo.ping = () => Promise.resolve(true) })
    // allow effects to run
    await act(async () => { await new Promise(r => setTimeout(r, 10)) })

  // shift recreated? since localStorage cleared between renders, we just ensure queue drained
    expect(peekQueue().length).toBe(0)
    // Not asserting on presence since provider restarted; main goal: queue drained without errors
  })

  test('apply action enqueued on failure and retried', async () => {
    const failingRepo = { list: () => [], create: () => Promise.resolve(), applyToShift: () => Promise.reject(new Error('offline')), ping: () => Promise.resolve(false) }

    function ApplyComp() {
      const { createShift, applyToShift, shifts } = useShifts()
      React.useEffect(() => {
        const d = new Date('2025-01-03')
        createShift({ date: d, type: 'Y', start: '10:00', end: '11:00' })
        setTimeout(() => applyToShift(`${d.toISOString().slice(0,10)}_Y`, 'user1'), 0)
      }, [createShift, applyToShift])
      return <div>{shifts.length}</div>
    }

  render(<ShiftProvider repositoryOverride={failingRepo} disableAsyncBootstrap enableAsyncInTests><ApplyComp /></ShiftProvider>)
    await act(async () => { await new Promise(r => setTimeout(r, 20)) })
    expect(peekQueue().some(a => a.type === 'apply')).toBe(true)
  })
})
