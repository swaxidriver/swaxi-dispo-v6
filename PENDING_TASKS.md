# Pending & Planned Tasks

This file tracks the evolving backlog so it is visible inside the repo. Update as features land or feedback arrives.

## 1. Immediate Next (Iteration Focus)

- [ ] Persist newly created shifts to repository layer (IndexedDB + SharePoint) instead of only local state.
- [ ] Auto-assign algorithm (fair distribution, respect conflicts & roles).
- [ ] Toast / inline ephemeral feedback component (notifications currently only in dropdown).
- [ ] Address React act() warnings from Headless UI components in tests (wrap interactions or add test utils helper).

## 2. Feedback System Enhancements

- [ ] Add test coverage for FeedbackContext + modal submit.
- [ ] Optional GitHub issue link / mailto export for each feedback item.
- [ ] Provide filtering & simple status (new / triaged / done) for feedback entries.
- [ ] Surface top 3 recent feedback items on Dashboard for admins.

## 3. Audit & Role Management

- [ ] Persist audit events (assign, apply, create, feedback) to durable storage.
- [ ] Role management persistence (store roles in repository / SharePoint, not only in-memory).

## 4. Reliability & Error Handling

- [ ] Central error boundary enrichment: user-facing error IDs + copy-to-clipboard diagnostics.
- [ ] Repository operation retry & offline queue for create/apply/assign.

## 5. Accessibility & UX Polish

- [ ] Keyboard trap & focus return in new FeedbackModal.
- [ ] Announce notifications via aria-live region.
- [ ] Internationalization scaffold (extract German strings).

## 6. Performance / Tech Debt

- [ ] Lazy load less-used pages (Administration, Audit) via React.lazy.
- [ ] Split large contexts (ShiftContext) into smaller slices if growth continues.

## 7. Collected Feedback (Most Recent First)

_Automatically populated at runtime in localStorage; export via Feedback modal. Consider synchronizing to backend later._

---

Generated on: 2025-08-26
