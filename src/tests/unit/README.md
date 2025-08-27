# Unit Tests

Fast, deterministic: pure functions, reducers, small presentational components.

## Guidelines

- No timers, network, IndexedDB, SharePoint, or real timeouts.
- Use factories from `../utils/factories` for data.
- Keep React Rendering shallow (no complex provider wiring) – otherwise treat as integration.
- Aim for >75% coverage in these folders (enforced via Jest thresholds).
