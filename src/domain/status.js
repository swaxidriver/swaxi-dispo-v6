// Status domain model (P0-5)

export const STATUS = Object.freeze({
  OPEN: 'open',
  ASSIGNED: 'assigned',
  CANCELLED: 'cancelled',
})

// Allowed transitions map
// open -> assigned | cancelled
// assigned -> cancelled
// cancelled -> (no transitions)
const ALLOWED = new Set([
  'open:assigned',
  'open:cancelled',
  'assigned:cancelled'
])

export function canTransition(from, to) {
  if (from === to) return true
  return ALLOWED.has(`${from}:${to}`)
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition ${from} -> ${to}`)
  }
  return true
}
