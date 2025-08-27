# Swaxi Dispo Demo — Implementation & Issue Plan (LLM‑friendly)

**Repository:** `swaxidriver/swaxi-dispo-v6`  
**Target:** Local-only demo (GitHub Pages), no backend, React (UMD) + Tailwind via CDN, state in `localStorage`.  
**Priority:** Stability first, then UX & Add‑ons.  
**Brand/CD:** Use swaxi color tokens (`--brand-primary`, `--brand-accent`, etc.); keep typography consistent.

---

## 0) Branching, Releases & Project Conventions

### Branching model (short-lived branches)
- `main` – stable, deployed to GitHub Pages
- `develop` – integration/testing
- `feature/<epic-or-scope>-<short-title>` – one scope per PR (e.g., `feature/add-live-update-banner`)
- `fix/<short-title>` – bug fixes
- `release/vX.Y.Z` – release hardening branch (optional for larger drops)
- `hotfix/vX.Y.Z+1` – urgent prod fix

### Versioning
- Semantic versioning for the demo: `v6.M.m` (e.g., `v6.3.0` for the next planned drop).
- Always update `CHANGELOG.md` and add a Git tag **after** merging to `main`.

### Releases & Pages
- GitHub Pages serves `index.html` from `/docs` or `/` (current setup).  
- On release:
  1) Bump version string in HTML title/footer & `CHANGELOG.md`.
  2) Tag: `git tag v6.X.Y && git push --tags`.
  3) Create GitHub Release with short notes (copy from `CHANGELOG.md`).

### Labels (standardize for Issues/PRs)
`type:feature`, `type:bug`, `type:chore`, `type:doc`, `prio:P0`, `prio:P1`, `prio:P2`, `area:UI`, `area:logic`, `area:perf`, `area:state`, `role:admin`, `role:chief`, `role:disponent`, `role:analyst`, `a11y`, `i18n`, `good first issue`

### PR Checklist (Definition of Done)
- [ ] Compiles in browser (no console errors).
- [ ] No regressions on: load, add service, assign, filters, mobile nav.
- [ ] `localStorage` migration safe; no data loss on refresh.
- [ ] Tests: manual smoke (see **Appendix B**).
- [ ] Updated `CHANGELOG.md` & version banner text if user facing.
- [ ] Feature flags/i18n keys added where relevant.
- [ ] Screenshots/GIFs attached (desktop + mobile).

---

## 1) Milestones (ordered)

| Milestone | Goal | Branch prefix | Priority |
|---|---|---|---|
| M0 Hardening | Fix obvious bugs, stabilize state & UI | `fix/` | P0 |
| M1 UX Baseline | Live Update Banner + Changelog Sheet + Tooltips | `feature/` | P0 |
| M2 Analytics | Mini analytics tiles (counts, conflicts) | `feature/` | P1 |
| M3 Calendar | Month/Week View (dispo) | `feature/` | P1 |
| M4 Serienbewerbung | Multi-select & apply | `feature/` | P1 |
| M5 Audit Log | Admin-only change log | `feature/` | P1 |
| M6 Settings & i18n | Settings tab + language switch (de/en) | `feature/` | P1 |
| M7 Drag & Drop | Drag to reassign/move shifts | `feature/` | P2 |
| M8 Dark Mode | CD-compliant themes | `feature/` | P2 |
| M9 Heuristics | Auto-assign prototype | `feature/` | P2 |
| M10 Perf & A11y | Virtualization (optional), accessibility | `feature/` | P2 |

> Dependencies: M0 precedes all; M1 precedes most UX; M6 is a cross-cutting concern to wire new strings; M9 depends on stable conflict matrix (M0).

---

## 2) Epics (with outcome & acceptance)

### Epic E0 – Stability & State Safety (M0)
**Outcome:** No duplicate IDs, safe midnight crossing, conflict matrix consistent, autosave and restore robust.  
**Acceptance:** No console errors; add/clone “10 Tage” never duplicates IDs; overlap across midnight detected; restoring from snapshot prompts once and works.

**Planned issues:**
1. **[P0] Fix ID & dedup on “10 Tage anlegen”**  
   _Labels:_ `type:bug`, `prio:P0`, `area:state`  
   _Tasks:_ Ensure `uid()` uniqueness; run `dedupById` before commit; test with 3× create in a row.  
   _AC:_ Exactly N new entries, no duplicates; refresh retains N.

2. **[P0] Midnight overlap correctness**  
   _Labels:_ `type:bug`, `prio:P0`, `area:logic`  
   _Tasks:_ Normalize end < start as overnight; `overlaps()` covers [start,end) across midnight.  
   _AC:_ Abend 21:00–05:30 collides where expected; badges show.  

3. **[P0] Snapshot & stale-state restore**  
   _Labels:_ `type:bug`, `prio:P0`, `area:state`  
   _Tasks:_ 30s autosave; versioned key: `swaxi.v6.{schemaVersion}`; prompt when stale.  
   _AC:_ Simulate tab A/B; B shows restore dialog, works once.

---

### Epic E1 – UX Baseline (M1)
**Outcome:** Subtle polish without backend: update banner, changelog modal, tooltips.  
**Acceptance:** Banner appears if `appVersion` changed; changelog opens via footer; tooltips on badges/actions.

**Planned issues:**
1. **[P0] Live Update Banner**  
   _Labels:_ `type:feature`, `prio:P0`, `area:UI`  
   _Tasks:_ Poll `meta[data-app-version]` or `/version.json`; show sticky banner “Neue Version verfügbar – neu laden”; manual reload only.  
   _AC:_ Edit version → banner appears in ≤60s; click reload.

2. **[P0] Changelog Sheet**  
   _Labels:_ `type:feature`, `prio:P0`, `area:doc`  
   _Tasks:_ Inline const `CHANGELOG` or fetch; small modal; link in footer.  
   _AC:_ Modal lists latest 10 items; keyboard esc closes.

3. **[P0] Tooltips (Conflict & Roles)**  
   _Labels:_ `type:feature`, `prio:P0`, `area:UI`  
   _Tasks:_ `title=""` + lightweight custom tooltip for mobile long‑press; add to conflict badges and disabled actions.  
   _AC:_ Tooltip never obstructs primary buttons; mobile press ≥600ms.

---

### Epic E2 – Mini Analytics (M2)
**Outcome:** KPI tiles at top.  
**Acceptance:** Shows counts: open shifts, assigned today, total conflicts, applications 7d.

**Planned issues (all `prio:P1`):**
- Compute KPIs from in‑memory state; ensure ≤2ms on 500 rows.
- Add “view source” icon → jumps to filtered list.

---

### Epic E3 – Calendar Overview (M3)
**Outcome:** Month/Week calendar for Dispo with markers; click → detail pane.  
**Acceptance:** Rendering ≤150ms/month; click opens right drawer with actions (assign/apply).

**Issues (`prio:P1`):**
- Stateless calendar component with memoized cells.
- Unassigned shifts = colored dot; today outlined; keyboard nav (←→↑↓).

---

### Epic E4 – Serienbewerbung (M4)
**Outcome:** Multi-select days → single confirm; inline conflicts.  
**Acceptance:** Selected badges show count; conflict banner lists reasons; applying writes N entries atomically.

---

### Epic E5 – Audit Log (Admin) (M5)
**Outcome:** Client‑only append‑only log in `localStorage`.  
**Acceptance:** “Audit” tab gated by role=Admin; shows time, actor, role, action, count; export JSON.

---

### Epic E6 – Settings & i18n (M6)
**Outcome:** Settings tab with switches; i18n (de/en) using simple dictionary.  
**Acceptance:** Language switch toggles live (strings only); theme preference persists.

**Settings proposals:**
- Language: de/en (default: de)  
- Theme: Light/Dark/System  
- Role: Disponent/Chief/Admin/Analyst (for demo)  
- Time format: 24h/AM‑PM  
- Conflict rules toggles (enable/disable checks)  
- Autosave interval (15/30/60s)  
- “Danger zone”: Reset demo data / Export JSON

---

### Epic E7 – Drag & Drop (M7)
**Outcome:** Drag shifts between days/slots; snap to valid ranges; block conflicts.  
**Acceptance:** Drop across midnight adjusts date; invalid moves show toast; undo (1 step).

---

### Epic E8 – Dark Mode (M8)
**Outcome:** CD‑compliant dark theme.  
**Acceptance:** Primary/Accent meet contrast; persists setting; auto (prefers‑color‑scheme).

---

### Epic E9 – Auto‑Assign Heuristic (M9)
**Outcome:** Prototype “Automatisch zuteilen” with simple scoring (availability, no overlap, fair distribution).  
**Acceptance:** Dry‑run modal shows proposed N matches; Apply writes changes + audit log; Easter‑egg text remains.

---

### Epic E10 – Performance & Accessibility (M10)
**Outcome:** Smooth on 500 items; basic a11y.  
**Acceptance:** No long tasks >50ms; focus order correct; keyboard activations work.

**Issues:**
- Optional list virtualization on desktop.
- ARIA roles on buttons, tooltips, dialogs.
- Reduce re-renders via `useMemo`/`useCallback` hot paths.

---

## 3) Issue Templates (copy/paste)

### Feature issue
```
Title: [P{0|1|2}] <Feature>: <short summary>

Labels: type:feature, prio:P?, area:<UI|logic|state|perf>, role:<optional>

Context
- Problem:
- Outcome (user visible):
- Non-goals:

Scope
- UI:
- State:
- Edge cases:

Acceptance Criteria
- [ ] ...
- [ ] ...

Test Plan
- Case 1:
- Case 2:

Notes for Copilot
- Touch files: index.html (React UMD), styles block, helpers.
- Prefer pure functions; avoid global leaks.
```

### Bug issue
```
Title: [P{0|1|2}] BUG: <short summary>

Labels: type:bug, prio:P?, area:<logic|state|UI>

Observed
- Steps:
- Result:

Expected
- ...

Hypothesis
- ...

Fix Plan
- ...

Retest
- [ ] Repro no longer possible
```

### Chore/Docs
```
Title: CHORE: <summary>

Labels: type:chore|type:doc

Tasks
- [ ] ...
```

---

## 4) Suggested Initial Issue Backlog (ordered)

1. [P0] E0‑1 Fix ID & dedup on “10 Tage anlegen”  
2. [P0] E0‑2 Midnight overlap correctness  
3. [P0] E0‑3 Snapshot & stale‑state restore  
4. [P0] E1‑1 Live Update Banner  
5. [P0] E1‑2 Changelog Sheet  
6. [P0] E1‑3 Tooltips for conflicts/roles  
7. [P1] E2‑1 Mini analytics tiles  
8. [P1] E3‑1 Calendar Month/Week view (basic)  
9. [P1] E4‑1 Serienbewerbung multi‑select  
10. [P1] E5‑1 Audit Log (Admin)  
11. [P1] E6‑1 Settings tab + i18n scaffold (de/en)  
12. [P2] E7‑1 Drag & Drop shifts  
13. [P2] E8‑1 Dark mode  
14. [P2] E9‑1 Auto‑assign heuristic (prototype)  
15. [P2] E10‑1 Perf & a11y pass

---

## 5) GitHub Workflow (for maintainers & LLMs)

1) **Create milestone** `v6.3.0 (M0+M1)`  
2) **Create issues** using templates; attach labels & milestone.  
3) **Branch per issue**: `feature/<id>-<slug>` or `fix/<id>-<slug>`.  
4) **Open PR** to `develop`; request review; attach screenshots/GIFs.  
5) **Merge** to `develop` after checks; smoke test `develop` via Pages preview (if configured).  
6) **Release**: merge `develop -> main`, tag `v6.3.0`, publish release, update Pages.  
7) **Post‑release**: create next milestone `v6.4.0` and move remaining issues.

**Commit style**
- Conventional commits (optional): `feat: …`, `fix: …`, `chore: …`, `docs: …`, `refactor: …`

**PR Template (snippet)**
```
## Summary
-

## Screenshots
- Desktop:
- Mobile:

## Risks / Rollback
-

## Checklist
- [ ] Manual smoke passed (Appendix B)
- [ ] No console errors
- [ ] State migration safe
```

---

## 6) Copilot Tips (for this codebase)

- Add **guide comments** near top of `index.html`:
  ```js
  // AI-GUIDE: All UI lives inside <script type="text/babel"> using React UMD.
  // AI-GUIDE: Persist state in localStorage under key "swaxi.v6.<schemaVersion>".
  // AI-GUIDE: Keep functions pure; avoid implicit globals.
  // AI-GUIDE: Use Tailwind utility classes; prefer inline styles only for brand tokens.
  ```
- Prompt patterns:
  - “Refactor `overlaps()` to correctly handle overnight ranges (end < start). Add tests in a demo function and console.assert them.”
  - “Add a banner that appears when `APP_VERSION` changes. Banner is sticky bottom on mobile; clicking reloads the page.”
  - “Introduce a lightweight i18n dictionary de/en; wrap user‑visible strings in `t('key')`.”

---

## Appendix A — Label Dictionary

- `prio:P0`: must for stability or user‑visible regression
- `prio:P1`: important feature for demo value
- `prio:P2`: nice to have / advanced
- `area:UI`, `area:logic`, `area:state`, `area:perf`, `a11y`, `i18n`
- `role:*`: primary audience/owner

---

## Appendix B — Manual Smoke Test (5 minutes)

1. Load app (desktop & mobile viewport). No console errors.  
2. Create “10 Tage” 3× → total = 30, no dup IDs.  
3. Check template rules (Mo–Do vs Fr–So).  
4. Add Nacht (21:00–05:30) overlapping Abend → conflict badge shows.  
5. Assign a user; ensure other open applications remain untouched.  
6. Trigger autosave (wait 30s); reload → state intact.  
7. Change `APP_VERSION` in code → banner appears → reload.  
8. Open changelog modal from footer; tooltips appear on conflict badges.  
9. Mobile: bottom nav sticky; counters update with filters.  

---

## Appendix C — i18n Scaffold (example)

```js
const I18N = {
  de: { reload: "Neu laden", updateAvailable: "Neue Version verfügbar", settings: "Einstellungen" },
  en: { reload: "Reload", updateAvailable: "New version available", settings: "Settings" }
};
function t(key, lang){ return (I18N[lang] && I18N[lang][key]) || key; }
```
