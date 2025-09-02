// Monotonic ID generator with persistence (P0-2)
// Ensures no collisions across sessions unless localStorage cleared.

const STORAGE_KEY = "id_counter_v1";
let inMemoryCounter = 0;
let loaded = false;

function loadCounter() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) inMemoryCounter = parseInt(raw, 10) || 0;
  } catch {
    /* ignore */
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, String(inMemoryCounter));
  } catch {
    /* ignore */
  }
}

export function generateId(prefix = "shf_") {
  loadCounter();
  inMemoryCounter += 1;
  persist();
  return prefix + inMemoryCounter.toString().padStart(6, "0");
}

export function peekCurrentId() {
  loadCounter();
  return inMemoryCounter;
}

export function __resetIdCounterForTests() {
  inMemoryCounter = 0;
  persist();
}
