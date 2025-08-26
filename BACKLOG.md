# Backlog & Pending Tasks

Legend: P0 = critical foundation, P1 = near-term, P2 = nice-to-have.

## ✅ Recently Completed

- P0-6 WorkLocation mandatory field (UI + domain) (v0.3.0)
- P0-7 Autosave snapshot restoration (v0.3.0)
- P0-8 Visible active role badge (v0.3.0)

## 📌 In Progress / Next

- P0-9 Theming tokens & typography unification (COMPLETED: tokens.css, Manrope font, token lint script)
- Expand role-based conditional rendering tests (shift creation button, templates, audit)
- Coverage uplift toward pre-defined thresholds (re‑enable stricter gates gradually)

## 🧪 Testing Strategy v2 (Planned)

- Introduce /src/tests/unit, /src/tests/integration, /src/tests/a11y
- Add data builders (factory functions) for shifts & users to reduce duplication
- Add custom Jest matcher set (e.g. toHaveNoA11yViolations wrapper)

## 🧭 Roadmap Candidates (P1)

- Shift Detail Modal (edit/duplicate/cancel actions)
- Series Application / Multi-apply flow with conflict preview
- Auto-assignment algorithm (fair distribution & availability filtering)
- Toast feedback system (success/error state) + global announcer
- Audit log persistence backend (SharePoint list or lightweight server)

## 🌐 Hybrid / SharePoint Enhancements (P1)

- Live SharePoint integration tests (conditional skip outside corporate network)
- Delta sync & conflict resolution when reconnecting

## 📊 Analytics (P1)

- Export CSV / XLS for shift overview
- Role-based analytics dashboard expansion

## 🔐 Security & Auth (P1)

- Session timeout & idle warning
- Optional SSO integration placeholder

## 🏗 Architecture / DX (P1/P2)

- Extract domain logic into /src/domain with pure functions & unit tests
- Introduce zod schemas for runtime validation (optional lightweight layer)
- Consider TanStack Query for remote data once SharePoint live

## 🧩 Quality Automation (P2)

- Visual regression baseline (Playwright + percy style snapshots)
- Lighthouse CI budget enforcement
- Bundle size guard in CI (size-limit)

## 🗂 Nice To Have (P2)

- User preference sync (theme, filters) to SharePoint profile
- Offline diff viewer for queued actions before drain

## 📝 Notes
This backlog is intentionally lightweight; promote items to CHANGELOG when shipped. Keep README high-level; implementation granularity lives here.


### Recent Theming Enhancements

- Switched primary font to Manrope for a more modern geometric look
- Added `lint:tokens` script to guard against raw hex usage
- Documented token usage and migration path in README
- Planned: JSON export of tokens for design tooling (Figma) & Tailwind var() mapping
