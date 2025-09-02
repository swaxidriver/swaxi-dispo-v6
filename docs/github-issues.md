# GitHub Issues to Create

Based on swaxi_issue_plan.md section 4 "Suggested Initial Issue Backlog". Copy each issue below into GitHub Issues.

---

## Issue 1: [P0] E0‑1 Fix ID & dedup on "10 Tage anlegen"

**Title:** [P0] BUG: Fix ID & dedup on "10 Tage anlegen"  
**Labels:** `type:bug`, `prio:P0`, `area:state`  
**Milestone:** v6.3.0 (M0+M1)  
**Epic:** E0 - Stability & State Safety

### Observed

- **Steps:** Click "10 Tage anlegen" multiple times in succession
- **Result:** Duplicate IDs generated, causing state corruption and UI inconsistencies

### Expected

- Each call should generate unique IDs
- No duplicate entries should be created
- Exactly N new entries for N button clicks

### Hypothesis

- ID generation function lacks uniqueness guarantee
- Missing deduplication logic before state commit
- Race conditions in rapid succession calls

### Fix Plan

- Ensure `uid()` function provides uniqueness (monotonic counter + prefix)
- Run `dedupById` before committing to state
- Add persistence for ID counter in localStorage
- Test with 3× create in a row scenario

### Retest

- [ ] Repro no longer possible
- [ ] Create "10 Tage" 3× → total = 30, no dup IDs
- [ ] Refresh retains exactly N entries

---

## Issue 2: [P0] E0‑2 Midnight overlap correctness

**Title:** [P0] BUG: Midnight overlap correctness  
**Labels:** `type:bug`, `prio:P0`, `area:logic`  
**Milestone:** v6.3.0 (M0+M1)  
**Epic:** E0 - Stability & State Safety

### Observed

- **Steps:** Create shift spanning midnight (e.g., 21:00-05:30)
- **Result:** Overlap detection fails or shows incorrect conflicts

### Expected

- Shifts crossing midnight should be handled correctly
- Overlap detection should work for overnight ranges
- Conflict badges should show when appropriate

### Hypothesis

- `overlaps()` function doesn't handle end < start cases
- Time comparison logic assumes same-day ranges
- Duration calculation incorrect for overnight shifts

### Fix Plan

- Normalize end < start as overnight shift logic
- Update `overlaps()` to cover [start,end) across midnight
- Test with Abend 21:00–05:30 overlapping scenarios
- Ensure conflict badges appear correctly

### Retest

- [ ] Repro no longer possible
- [ ] Abend 21:00–05:30 shows conflicts where expected
- [ ] Overnight shifts display correct duration

---

## Issue 3: [P0] E0‑3 Snapshot & stale‑state restore

**Title:** [P0] BUG: Snapshot & stale‑state restore  
**Labels:** `type:bug`, `prio:P0`, `area:state`  
**Milestone:** v6.3.0 (M0+M1)  
**Epic:** E0 - Stability & State Safety

### Observed

- **Steps:** Open app in multiple tabs, make changes in different tabs
- **Result:** State conflicts, data loss, or no restore prompt

### Expected

- Robust autosave mechanism
- Prompt when stale state detected
- Safe state restoration process

### Hypothesis

- Missing or inconsistent autosave intervals
- No versioned localStorage keys
- Missing stale state detection logic

### Fix Plan

- Implement 30s autosave throttling
- Use versioned key: `swaxi.v6.{schemaVersion}`
- Add stale state detection and restore dialog
- Ensure one-time restore prompt per session

### Retest

- [ ] Repro no longer possible
- [ ] Simulate tab A/B scenario
- [ ] Tab B shows restore dialog and works correctly
- [ ] Autosave triggers after 30s of changes

---

## Issue 4: [P0] E1‑1 Live Update Banner

**Title:** [P0] Feature: Live Update Banner  
**Labels:** `type:feature`, `prio:P0`, `area:UI`  
**Milestone:** v6.3.0 (M0+M1)  
**Epic:** E1 - UX Baseline

### Context

- **Problem:** Users don't know when app version changes
- **Outcome (user visible):** Subtle banner appears when new version detected
- **Non-goals:** Automatic reload, complex update mechanism

### Scope

- **UI:** Sticky banner with reload button
- **State:** Version comparison logic
- **Edge cases:** Multiple tab scenarios, version rollback

### Acceptance Criteria

- [ ] Poll `meta[data-app-version]` or `/version.json` periodically
- [ ] Show banner "Neue Version verfügbar – neu laden" when version changes
- [ ] Manual reload only (no automatic reload)
- [ ] Banner appears within ≤60s of version change
- [ ] Mobile-friendly positioning

### Test Plan

- **Case 1:** Edit version in code → banner appears
- **Case 2:** Click reload button → page refreshes
- **Case 3:** Multiple tabs → banner shows in all active tabs

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Use polling with reasonable interval (30-60s)
- Prefer simple implementation over complex state management

---

## Issue 5: [P0] E1‑2 Changelog Sheet

**Title:** [P0] Feature: Changelog Sheet  
**Labels:** `type:feature`, `prio:P0`, `area:doc`  
**Milestone:** v6.3.0 (M0+M1)  
**Epic:** E1 - UX Baseline

### Context

- **Problem:** Users can't see what's changed between versions
- **Outcome (user visible):** Modal showing recent changes accessible from footer
- **Non-goals:** External API calls, complex versioning UI

### Scope

- **UI:** Small modal with changelog content
- **State:** Changelog data (inline const or fetched)
- **Edge cases:** Long changelog content, mobile display

### Acceptance Criteria

- [ ] Inline `CHANGELOG` constant or fetch from file
- [ ] Small modal accessible from footer link
- [ ] Lists latest 10 changelog items
- [ ] Keyboard esc closes modal
- [ ] Mobile-responsive design

### Test Plan

- **Case 1:** Click changelog link in footer → modal opens
- **Case 2:** Press Esc → modal closes
- **Case 3:** Mobile view → modal fits screen properly

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Consider using existing CHANGELOG.md content
- Keep modal simple and lightweight

---

## Issue 6: [P0] E1‑3 Tooltips for conflicts/roles

**Title:** [P0] Feature: Tooltips for conflicts/roles  
**Labels:** `type:feature`, `prio:P0`, `area:UI`  
**Milestone:** v6.3.0 (M0+M1)  
**Epic:** E1 - UX Baseline

### Context

- **Problem:** Conflict badges and disabled actions lack explanation
- **Outcome (user visible):** Helpful tooltips explain conflicts and role restrictions
- **Non-goals:** Complex tooltip libraries, extensive animations

### Scope

- **UI:** Lightweight tooltips for badges and buttons
- **State:** Tooltip content and positioning logic
- **Edge cases:** Mobile touch, tooltip positioning near screen edges

### Acceptance Criteria

- [ ] `title=""` attributes for basic tooltips
- [ ] Custom tooltip for mobile long‑press (≥600ms)
- [ ] Tooltips on conflict badges explain the conflict
- [ ] Tooltips on disabled actions explain why disabled
- [ ] Tooltips never obstruct primary buttons

### Test Plan

- **Case 1:** Hover over conflict badge → tooltip shows conflict reason
- **Case 2:** Mobile long-press on badge → tooltip appears
- **Case 3:** Tooltip positioning near screen edges

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Prefer simple implementation over heavy libraries
- Consider accessibility (aria-label, etc.)

---

## Issue 7: [P1] E2‑1 Mini analytics tiles

**Title:** [P1] Feature: Mini analytics tiles  
**Labels:** `type:feature`, `prio:P1`, `area:UI`, `role:analyst`  
**Milestone:** v6.4.0 (M2+M3)  
**Epic:** E2 - Mini Analytics

### Context

- **Problem:** No quick overview of key metrics
- **Outcome (user visible):** KPI tiles at top showing counts and status
- **Non-goals:** Complex charts, historical data, external analytics

### Scope

- **UI:** Tile layout for key metrics
- **State:** Computed KPIs from in-memory state
- **Edge cases:** Large datasets, real-time updates

### Acceptance Criteria

- [ ] Shows counts: open shifts, assigned today, total conflicts, applications 7d
- [ ] Compute KPIs from in‑memory state
- [ ] Performance: ≤2ms computation on 500 rows
- [ ] "View source" icon → jumps to filtered list
- [ ] Responsive design for mobile

### Test Plan

- **Case 1:** Load app → tiles show correct counts
- **Case 2:** Add/remove shifts → tiles update automatically
- **Case 3:** Click "view source" → filters applied correctly

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Use memoization for performance
- Consider useMemo for expensive calculations

---

## Issue 8: [P1] E3‑1 Calendar Month/Week view (basic)

**Title:** [P1] Feature: Calendar Month/Week view (basic)  
**Labels:** `type:feature`, `prio:P1`, `area:UI`  
**Milestone:** v6.4.0 (M2+M3)  
**Epic:** E3 - Calendar Overview

### Context

- **Problem:** No calendar overview of shift distribution
- **Outcome (user visible):** Month/Week calendar showing shift markers with click actions
- **Non-goals:** Full calendar editing, drag-drop, external calendar sync

### Scope

- **UI:** Calendar grid with shift markers
- **State:** Calendar view state, date navigation
- **Edge cases:** Month boundaries, timezone handling, large shift counts per day

### Acceptance Criteria

- [ ] Stateless calendar component with memoized cells
- [ ] Rendering ≤150ms per month view
- [ ] Unassigned shifts = colored dot; today outlined
- [ ] Click opens right drawer with actions (assign/apply)
- [ ] Keyboard navigation (←→↑↓)

### Test Plan

- **Case 1:** Month view → shows shift markers correctly
- **Case 2:** Click on day → detail pane opens
- **Case 3:** Keyboard navigation → focus moves correctly

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Consider calendar library or custom implementation
- Focus on performance and simplicity

---

## Issue 9: [P1] E4‑1 Serienbewerbung multi‑select

**Title:** [P1] Feature: Serienbewerbung multi‑select  
**Labels:** `type:feature`, `prio:P1`, `area:logic`  
**Milestone:** v6.5.0 (M4+M5+M6)  
**Epic:** E4 - Serienbewerbung

### Context

- **Problem:** Users can't apply to multiple shifts at once
- **Outcome (user visible):** Multi-select days → single confirm with conflict preview
- **Non-goals:** Complex scheduling algorithms, external integrations

### Scope

- **UI:** Multi-select interface with batch actions
- **State:** Selection state, batch conflict detection
- **Edge cases:** Partial conflicts, large selections, undo capability

### Acceptance Criteria

- [ ] Selected badges show count
- [ ] Conflict banner lists specific conflict reasons
- [ ] Applying writes N entries atomically
- [ ] Undo capability for batch operations
- [ ] Performance acceptable for large selections

### Test Plan

- **Case 1:** Select multiple shifts → count badge updates
- **Case 2:** Conflicts detected → banner shows reasons
- **Case 3:** Apply → all entries created atomically

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Consider transaction-like state updates
- Focus on conflict detection accuracy

---

## Issue 10: [P1] E5‑1 Audit Log (Admin)

**Title:** [P1] Feature: Audit Log (Admin)  
**Labels:** `type:feature`, `prio:P1`, `area:state`, `role:admin`  
**Milestone:** v6.5.0 (M4+M5+M6)  
**Epic:** E5 - Audit Log

### Context

- **Problem:** No visibility into changes and actions
- **Outcome (user visible):** Admin-only tab showing change history with export
- **Non-goals:** Real-time sync, complex querying, external logging

### Scope

- **UI:** Audit log tab with filtering and export
- **State:** Client‑only append‑only log in localStorage
- **Edge cases:** Large log files, storage limits, log rotation

### Acceptance Criteria

- [ ] "Audit" tab gated by role=Admin
- [ ] Shows time, actor, role, action, count
- [ ] Export JSON functionality
- [ ] Log rotation to prevent storage overflow
- [ ] Search/filter capabilities

### Test Plan

- **Case 1:** Admin role → audit tab visible
- **Case 2:** Non-admin → audit tab hidden
- **Case 3:** Actions logged → entries appear in audit log

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Consider localStorage size limits
- Focus on role-based access control

---

## Issue 11: [P1] E6‑1 Settings tab + i18n scaffold (de/en)

**Title:** [P1] Feature: Settings tab + i18n scaffold (de/en)  
**Labels:** `type:feature`, `prio:P1`, `area:UI`, `i18n`  
**Milestone:** v6.5.0 (M4+M5+M6)  
**Epic:** E6 - Settings & i18n

### Context

- **Problem:** No user preferences or language options
- **Outcome (user visible):** Settings tab with language switch and preferences
- **Non-goals:** Complex i18n framework, RTL languages, external translation services

### Scope

- **UI:** Settings tab with switches and controls
- **State:** User preferences persistence, i18n dictionary
- **Edge cases:** Missing translations, preference migration, browser language detection

### Acceptance Criteria

- [ ] Language switch toggles live (strings only)
- [ ] Theme preference persists across sessions
- [ ] Settings include: Language (de/en), Theme (Light/Dark/System), Role, Time format
- [ ] Conflict rules toggles, Autosave interval settings
- [ ] "Danger zone": Reset demo data / Export JSON

### Test Plan

- **Case 1:** Switch language → UI updates immediately
- **Case 2:** Change theme → preference persists
- **Case 3:** Export JSON → downloads current state

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Use simple dictionary approach for i18n
- Consider browser localStorage for preferences

---

## Issue 12: [P2] E7‑1 Drag & Drop shifts

**Title:** [P2] Feature: Drag & Drop shifts  
**Labels:** `type:feature`, `prio:P2`, `area:UI`  
**Milestone:** v6.6.0 (M7+M8+M9+M10)  
**Epic:** E7 - Drag & Drop

### Context

- **Problem:** No intuitive way to move shifts between days/slots
- **Outcome (user visible):** Drag shifts between days with conflict prevention
- **Non-goals:** Complex gestures, multi-touch, external drag targets

### Scope

- **UI:** Drag and drop interface with visual feedback
- **State:** Temporary drag state, conflict validation during drag
- **Edge cases:** Invalid drop targets, midnight crossing, mobile touch

### Acceptance Criteria

- [ ] Drag shifts between days/slots
- [ ] Snap to valid time ranges
- [ ] Block conflicts with visual feedback
- [ ] Drop across midnight adjusts date automatically
- [ ] Invalid moves show toast notification
- [ ] Undo capability (1 step)

### Test Plan

- **Case 1:** Drag to valid slot → shift moves
- **Case 2:** Drag to conflicting slot → blocked with feedback
- **Case 3:** Drag across midnight → date adjusts

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Consider HTML5 drag/drop API or touch events
- Focus on accessibility considerations

---

## Issue 13: [P2] E8‑1 Dark mode

**Title:** [P2] Feature: Dark mode  
**Labels:** `type:feature`, `prio:P2`, `area:UI`  
**Milestone:** v6.6.0 (M7+M8+M9+M10)  
**Epic:** E8 - Dark Mode

### Context

- **Problem:** No dark theme option for users
- **Outcome (user visible):** CD-compliant dark theme with automatic/manual switching
- **Non-goals:** Multiple theme variants, complex customization

### Scope

- **UI:** Dark theme implementation across all components
- **State:** Theme preference persistence
- **Edge cases:** System preference detection, theme transition animations

### Acceptance Criteria

- [ ] Primary/Accent colors meet contrast requirements
- [ ] Theme setting persists across sessions
- [ ] Auto mode uses prefers‑color‑scheme
- [ ] Smooth transitions between themes
- [ ] All components support dark mode

### Test Plan

- **Case 1:** Toggle dark mode → theme switches
- **Case 2:** Auto mode → follows system preference
- **Case 3:** Refresh → theme preference persists

### Notes for Copilot

- Touch files: index.html (React UMD), styles block, CSS variables
- Use CSS custom properties for theme switching
- Consider existing brand color tokens

---

## Issue 14: [P2] E9‑1 Auto‑assign heuristic (prototype)

**Title:** [P2] Feature: Auto‑assign heuristic (prototype)  
**Labels:** `type:feature`, `prio:P2`, `area:logic`  
**Milestone:** v6.6.0 (M7+M8+M9+M10)  
**Epic:** E9 - Auto‑Assign Heuristic

### Context

- **Problem:** Manual assignment is time-consuming for many shifts
- **Outcome (user visible):** "Automatisch zuteilen" with simple scoring algorithm
- **Non-goals:** Machine learning, complex optimization, external algorithms

### Scope

- **UI:** Auto-assign button with dry-run preview
- **State:** Assignment algorithm, scoring logic
- **Edge cases:** No available users, all conflicts, partial assignments

### Acceptance Criteria

- [ ] Prototype scoring: availability, no overlap, fair distribution
- [ ] Dry‑run modal shows proposed N matches
- [ ] Apply button writes changes + audit log entry
- [ ] Easter‑egg text for algorithm description
- [ ] Graceful handling of edge cases

### Test Plan

- **Case 1:** Click auto-assign → preview shows proposals
- **Case 2:** Apply → assignments created and logged
- **Case 3:** No available users → appropriate message

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Depends on stable conflict matrix (M0)
- Keep algorithm simple and explainable

---

## Issue 15: [P2] E10‑1 Perf & a11y pass

**Title:** [P2] Feature: Perf & a11y pass  
**Labels:** `type:feature`, `prio:P2`, `area:perf`, `a11y`  
**Milestone:** v6.6.0 (M7+M8+M9+M10)  
**Epic:** E10 - Performance & Accessibility

### Context

- **Problem:** App may not perform well with large datasets or lack accessibility
- **Outcome (user visible):** Smooth performance on 500 items with basic a11y compliance
- **Non-goals:** Perfect accessibility score, complex optimization

### Scope

- **UI:** Performance optimizations, accessibility improvements
- **State:** Efficient re-rendering, memory optimization
- **Edge cases:** Large datasets, screen readers, keyboard-only users

### Acceptance Criteria

- [ ] No long tasks >50ms during normal operation
- [ ] Focus order correct throughout app
- [ ] Keyboard activations work for all interactive elements
- [ ] Optional list virtualization on desktop
- [ ] ARIA roles on buttons, tooltips, dialogs
- [ ] Reduce re-renders via useMemo/useCallback on hot paths

### Test Plan

- **Case 1:** Load 500 items → performance remains smooth
- **Case 2:** Keyboard navigation → all elements accessible
- **Case 3:** Screen reader → content properly announced

### Notes for Copilot

- Touch files: index.html (React UMD), styles block
- Use React DevTools Profiler for performance analysis
- Consider accessibility testing tools

---

## Summary

Total Issues: 15

- P0 (Critical): 6 issues (E0-1 through E1-3)
- P1 (Important): 5 issues (E2-1 through E6-1)
- P2 (Nice to have): 4 issues (E7-1 through E10-1)

**Next Steps:**

1. Create the 4 milestones in GitHub
2. Create the required labels in GitHub
3. Copy each issue above into GitHub Issues
4. Assign issues to appropriate milestones
5. Begin development starting with P0 issues
