// Deterministic initial seed for Demo (P0-1)
// Generates a fixed 7-day window of shifts with three standard types per day.
// IMPORTANT: Only used when no existing shifts are present (first run / reset).

import { normalizeGeneratedShifts } from '../contexts/ShiftContextCore'

// Base Monday reference (keeps demo stable across weeks)
const SEED_BASE_DATE = '2025-01-06' // Monday
const DAY_COUNT = 7

// Fixed shift templates (name maps to type)
const SHIFT_TEMPLATES = [
  { name: 'Frueh', start: '06:00', end: '14:00' },
  { name: 'Spaet', start: '14:00', end: '22:00' },
  { name: 'Nacht', start: '22:00', end: '06:00' }, // Over-midnight (handled later)
]

function addDays(baseIso, days) {
  const d = new Date(baseIso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function getInitialSeedRaw() {
  const raw = []
  for (let i = 0; i < DAY_COUNT; i++) {
    const dateIso = addDays(SEED_BASE_DATE, i)
    SHIFT_TEMPLATES.forEach(t => {
      raw.push({ date: dateIso, type: t.name, start: t.start, end: t.end })
    })
  }
  return raw
}

export function getInitialSeedShifts() {
  // Normalize into full shift objects (id, status, etc.).
  const normalized = normalizeGeneratedShifts(getInitialSeedRaw())
  // Ensure deterministic ordering (date asc, type asc)
  return normalized.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.type.localeCompare(b.type)))
}

export function applyInitialSeedIfEmpty(existing = []) {
  if (existing && existing.length) return existing
  return getInitialSeedShifts()
}

export const __SEED_INTERNALS__ = { SEED_BASE_DATE, DAY_COUNT, SHIFT_TEMPLATES }

// Note: Over-midnight shift (22:00-06:00) currently stored as-is; later story (Zeit/Über-Mitternacht) will refine duration & conflict logic.
