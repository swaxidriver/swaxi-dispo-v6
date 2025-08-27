# Integration Tests

Cross-layer behavior: contexts + services + repositories + UI orchestration.

## Guidelines

- May touch localStorage, IndexedDB (fake-indexeddb), timers.
- Use real reducers & repositories unless isolation is the goal.
- Keep each file under ~2s runtime; split if slower.
- Avoid asserting on implementation details (focus on visible outcomes & state).
