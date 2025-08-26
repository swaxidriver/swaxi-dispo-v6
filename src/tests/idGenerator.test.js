import { generateId, __resetIdCounterForTests, peekCurrentId } from '../utils/id'

describe('ID Generator', () => {
  beforeEach(() => {
    __resetIdCounterForTests()
  })

  test('monotonic increasing with zero padding', () => {
    const a = generateId()
    const b = generateId()
    expect(a).not.toEqual(b)
    expect(a).toMatch(/^shf_\d{6}$/)
    expect(b).toMatch(/^shf_\d{6}$/)
    const na = parseInt(a.split('_')[1], 10)
    const nb = parseInt(b.split('_')[1], 10)
    expect(nb).toBe(na + 1)
  })

  test('persists counter value', () => {
    generateId()
    const current = peekCurrentId()
    expect(current).toBe(1)
  })
})
