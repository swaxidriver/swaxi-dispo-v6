# GitHub Milestones Definition

Based on the swaxi_issue_plan.md, these milestones should be created in GitHub:

## Milestone 1: v6.3.0 (M0+M1) - Stability & UX Baseline
**Due Date:** TBD  
**Description:** Fix obvious bugs, stabilize state & UI + Live Update Banner + Changelog Sheet + Tooltips  
**Priority:** P0  
**Dependencies:** M0 precedes all other milestones  

**Included Issues:**
- E0‑1 Fix ID & dedup on "10 Tage anlegen"
- E0‑2 Midnight overlap correctness  
- E0‑3 Snapshot & stale‑state restore
- E1‑1 Live Update Banner
- E1‑2 Changelog Sheet
- E1‑3 Tooltips for conflicts/roles

## Milestone 2: v6.4.0 (M2+M3) - Analytics & Calendar  
**Due Date:** TBD  
**Description:** Mini analytics tiles (counts, conflicts) + Month/Week View (dispo)  
**Priority:** P1  
**Dependencies:** Requires M0+M1 completion  

**Included Issues:**
- E2‑1 Mini analytics tiles
- E3‑1 Calendar Month/Week view (basic)

## Milestone 3: v6.5.0 (M4+M5+M6) - Advanced Features
**Due Date:** TBD  
**Description:** Multi-select & apply + Admin-only change log + Settings tab + language switch (de/en)  
**Priority:** P1  
**Dependencies:** Requires M0+M1 completion; M6 is cross-cutting for i18n  

**Included Issues:**
- E4‑1 Serienbewerbung multi‑select
- E5‑1 Audit Log (Admin)
- E6‑1 Settings tab + i18n scaffold (de/en)

## Milestone 4: v6.6.0 (M7+M8+M9+M10) - Polish & Performance
**Due Date:** TBD  
**Description:** Drag to reassign/move shifts + CD-compliant themes + Auto-assign prototype + Virtualization & accessibility  
**Priority:** P2  
**Dependencies:** M9 depends on stable conflict matrix (M0)  

**Included Issues:**
- E7‑1 Drag & Drop shifts
- E8‑1 Dark mode
- E9‑1 Auto‑assign heuristic (prototype)
- E10‑1 Perf & a11y pass

## Milestone Creation Instructions

To create these milestones in GitHub:

1. Go to the repository Issues tab
2. Click "Milestones"
3. Click "New milestone"
4. Use the title, description, and due date above
5. Assign issues to milestones as they are created

## Labels Required

These labels should be created in the repository:

### Type Labels
- `type:feature` - New functionality
- `type:bug` - Bug fixes  
- `type:chore` - Maintenance tasks
- `type:doc` - Documentation updates

### Priority Labels  
- `prio:P0` - Critical for stability
- `prio:P1` - Important features
- `prio:P2` - Nice to have

### Area Labels
- `area:UI` - User interface changes
- `area:logic` - Business logic
- `area:perf` - Performance improvements  
- `area:state` - State management

### Role Labels
- `role:admin` - Admin functionality
- `role:chief` - Chief user features
- `role:disponent` - Disponent features
- `role:analyst` - Analytics features

### Special Labels
- `a11y` - Accessibility improvements
- `i18n` - Internationalization  
- `good first issue` - Good for new contributors