// Simple in-memory + localStorage persisted offline action queue skeleton.
// Will be used to queue shift operations (create/apply/assign) while offline
// and replay them when connectivity returns.
// Actions shape: { id, type: 'create'|'apply'|'assign', payload, ts }

const KEY = "offline_queue";

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(q) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    /* ignore */
  }
}

let queue = loadQueue();

export function enqueue(action) {
  queue.push(action);
  saveQueue(queue);
}

export function drain(handler) {
  const current = [...queue];
  queue = [];
  saveQueue(queue);
  return current.reduce(async (p, act) => {
    await p;
    try {
      await handler(act);
    } catch {
      /* requeue on failure? (future) */
    }
    return Promise.resolve();
  }, Promise.resolve());
}

export function peekQueue() {
  return [...queue];
}

// Test-only helper to reset queue state between tests
export function clearQueueForTests() {
  queue = [];
  saveQueue(queue);
}
