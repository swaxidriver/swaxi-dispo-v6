# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2025-08-27

### Added (0.3.0)

- Visible active role badge in navigation (P0-8) plus capability helper functions in `constants.js`.
- WorkLocation mandatory field enforcement with UI validation + domain guard (P0-6).
- Autosave snapshot restoration pipeline (`restoreFromSnapshot`) with conflict recomputation (P0-7).
- Version metadata injection (semantic version, commit, build number, build time) via Vite defines and `VersionBadge` component rendered in navigation.
- Header documentation comment for `ShiftContext.jsx` outlining responsibilities.

### Changed (0.3.0)

- Navigation now shows application version (v0.3.0+) alongside brand for quick diagnostics.
- README extended with testing strategy v2, versioning & backlog sections.
- Introduced design tokens (`tokens.css`) + persistent theme with system preference + Lato font integration; legacy Tailwind brand-* classes retained for staged migration.
- Modernized primary font from Lato to Manrope (geometric humanist) with fallback chain.
- Added token lint script (`npm run lint:tokens`) to detect raw hex colors outside approved files.

### Internal / Tooling (0.3.0)

- Added `VersionBadge.jsx` and build meta injection in `vite.config.js` (constants already present; using existing build meta pattern).
- Introduced preliminary backlog file to track upcoming tasks.

### Next

- Expand role-based conditional rendering tests to other components (Shift creation, templates, audit gating).
- Introduce test categorization folders (unit/, integration/, accessibility/).
- Consider migrating offline queue tests to isolated integration suite.


## [0.2.0] - 2025-08-26

### Added (0.2.0)

- Offline action queue (create/apply/assign) with automatic drain on reconnect; queued creates marked via `pendingSync` flag.
- Integration tests for offline create + apply replay.
- Accessibility improvements: feedback modal focus trap, ESC close, focus restoration, aria-live status messaging, global polite aria-live region.
- Runtime safety test for `RoleManagement` component.

### Changed (0.2.0)

- Shift creation now optimistic with retry + queue fallback instead of silent failure.
- Apply / assign actions enqueue on repository failure for later replay.

### Fixed (0.2.0)

- Prevent potential runtime error in `RoleManagement` when `users` or `onUpdateRole` props are missing (defaults + empty state).

### Internal / Tooling

- Added test helper to clear offline queue between tests.
- Refined ShiftContext to drain queue when online state becomes true.

### Next (follow-up)

- Visual toast feedback for applications & assignments using global aria-live container.
- Auto-assign algorithm.
- Audit persistence backend.
- Shift detail modal.

## [Unreleased]

### Planned / Changes

- Firebase initialization stubbed (deferred) in `firebaseConfig.js`; exports now null placeholders until backend needed.
- `migrationService` tests temporarily skipped (placeholder) pending real Firebase integration.
- Deployment workflow hardened: added retry/backoff npm install logic, removed forced cache clean and `--force` usage to mitigate intermittent registry 403s.

### Additions / QA (Unreleased)

- SharePoint service fallback tests (error paths) in place; success path coverage planned.

### Next Steps (Unreleased)

- Re-enable Firebase by restoring original config and unskipping migration tests (create follow-up ticket).

## [0.1.0-test] - 2025-08-26

### Added

- Shift assignment workflow with `assignShift` action and notifications.
- Notification center with mark single / mark all read functionality.
- Week calendar view with proportional duration rendering + overnight shift spanning.
- Shift templates context (CRUD) and automatic injection for upcoming days.
- Auth context with role-based navigation gating (admin/chief/disponent/analyst).
- Tests: shift assignment status update; notification read / mark all read.
- Babel + Jest ESM configuration (React 19, jsdom environment, ResizeObserver + IntersectionObserver mocks).

### Changed

- Refactored shift reducer and context core separation.
- Updated README with feature overview and deployment instructions.
- Relaxed coverage thresholds temporarily during early test build-out.

### Fixed

- Lint issues related to unused imports via safe references.
- JSX transform issues in Jest by adding `babel.config.cjs`.

### Pending / Roadmap

- Expand test coverage (conflict detection, series applications, calendar rendering).
- Implement shift detail / creation modal.
- Reinstate coverage thresholds after sufficient test breadth.
- SharePoint live data wiring (currently stubbed / hybrid placeholder).

---

Generated as part of initial public test release.
