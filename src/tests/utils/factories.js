// Test Data Factories
// Lightweight builders to reduce duplication in unit/integration tests.

let __idCounter = 0;
const nextId = (p = "t") => `${p}_${(++__idCounter).toString(36)}`;

export function buildUser(overrides = {}) {
  return {
    id: overrides.id || nextId("usr"),
    name: overrides.name || "Test User",
    role: overrides.role || "disponent",
    ...overrides,
  };
}

export function buildShift(overrides = {}) {
  const base = {
    id: overrides.id || nextId("shf"),
    date: overrides.date || new Date().toISOString().slice(0, 10),
    start: overrides.start || "08:00",
    end: overrides.end || "12:00",
    location: overrides.location || "A",
    status: overrides.status || "open",
    assignments: overrides.assignments || [],
    applications: overrides.applications || [],
  };
  return { ...base, ...overrides };
}

export function buildApplication(overrides = {}) {
  return {
    id: overrides.id || nextId("app"),
    shiftId: overrides.shiftId || nextId("shf"),
    userId: overrides.userId || nextId("usr"),
    createdAt: overrides.createdAt || Date.now(),
    ...overrides,
  };
}

export function resetFactoryIds() {
  __idCounter = 0;
}
