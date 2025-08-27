# Pending & Planned Tasks

This file tracks the evolving backlog so it is visible inside the repo. Update as features land or feedback arrives.

## 1. Immediate Next (Iteration Focus)

- [x] Persist newly created shifts to repository layer (IndexedDB + SharePoint) instead of only local state (optimistic + pendingSync + retry / queue).
- [ ] Auto-assign Algorithm (faire Verteilung, Konflikte & Rollen berücksichtigen).
- [ ] Ephemere Toast-Komponente (aria-live) für Bewerbungen / Zuweisungen / Feedback.
- [x] React act() Warnungen entschärft (Test-Setup Anpassung in `jest.setup.js`).
- [x] Offline Aktions-Queue für create/apply/assign mit Re-Drain beim Online-Status.
- [x] Grundlegende Germanisierung sichtbarer UI-Texte (Navigation, Login, FeedbackModal).
- [ ] Settings / Einstellungen Seite (Grundgerüst) inkl. zukünftige Spracheinstellung (i18n Umschaltung) & Anzeige von App-Version.

## 2. Feedback System Enhancements

- [x] Add test coverage for FeedbackContext + modal submit (`FeedbackModal.test.jsx`).
- [ ] Optional GitHub-Issue-Link / mailto Export pro Feedback-Eintrag.
- [ ] Provide filtering & simple status (new / triaged / done) for feedback entries.
- [ ] Surface top 3 recent feedback items on Dashboard for admins.

## 3. Audit & Role Management

- [ ] Persist audit events (assign, apply, create, feedback) to durable storage.
- [ ] Role management persistence (store roles in repository / SharePoint, not only in-memory).

## 4. Reliability & Error Handling

- [ ] Central error boundary enrichment: user-facing error IDs + copy-to-clipboard diagnostics.
- [x] Repository Operation Retry & Offline Queue für create/apply/assign.

## 5. Accessibility & UX Polish

- [x] Keyboard Trap & Fokus-Rückgabe im FeedbackModal.
- [x] Global aria-live Region (Grundlage für Toasts) – implementiert.
- [x] Erste Germanisierung aller sichtbaren Navigation/Login/Feedback Texte.
- [ ] Vollständige Internationalisierung (String-Extraktion + Language Switch).
- [ ] Settings-Seite mit Sprachauswahl (Persistenz: localStorage `lang` + `&lt;html lang="..."&gt;` Update).
- [ ] Kontrast-Audit (WCAG AA) für Primär-/Akzentfarben (Token ggf. anpassen).
- [ ] Einheitliche sichtbare Fokus-Indikatoren (Tailwind `focus-visible:ring` überall).
- [ ] Rolle="navigation" ergänzende Landmark Labels (Sekundär/Unterbereiche falls nötig).
- [ ] Toast-Komponente mit automatischem Fokus-Management für wichtige Alerts (z.B. Fehler) + `role="alert"`.
- [ ] `prefers-reduced-motion` respektieren (Animationen reduzieren oder abschalten).
- [ ] Prüfung Tab-Reihenfolge & Skip-Link Erweiterung (z.B. direkt zur Navigation / zum Footer).
- [x] Beschreibende Tooltips / Disabled-Gründe für Aktionsbuttons (Status / Login Requirement) integriert.
- [ ] Tabellen Caption + `scope="col"` + SR-only Sortierhinweise bei ShiftTable.
- [ ] Live-Status-Badge (Online/Offline) mit textueller Alternative & `aria-live="polite"` nur bei Änderung.
- [ ] Form Labels: Durchgängige Verbindung (id/for), Placeholder nicht als alleinige Beschreibung.
- [ ] Farbige Status (ASSIGNED/OPEN) zusätzlich mit Icon/Text (nicht nur Farbe) für Farbsehschwäche.
- [ ] Konflikt-Code Mapping in UI weiter verdichten (Badges mit Icons statt Textliste)
- [ ] Konflikt-Metadaten (z.B. betroffene Shift-IDs) für zukünftiges Hover-Detail Panel
- [ ] Unit Tests für `conflicts.js` Mapping (derzeit nur indirekt)
- [ ] Audit-Log Liste als `<ul>` oder `<table>` mit semantischer Auszeichnung.
- [ ] Prüfen auf ausreichende Zielgröße (mind. 44x44 CSS px) bei Touch-Buttons.
- [ ] Tastatur-Shortcut Übersicht (Hilfe-Dialog) – optional F1 / ? Trigger.

## 6. Performance / Tech Debt

- [ ] Lazy load less-used pages (Administration, Audit) via React.lazy.
- [ ] Split large contexts (ShiftContext) into smaller slices if growth continues.

## 7. Collected Feedback (Most Recent First)

_Automatically populated at runtime in localStorage; export via Feedback modal. Consider synchronizing to backend later._

---

Generated on: 2025-08-26

## 8. Hybrid SharePoint Integration (Flag aktuell AUS)

- [x] TestPage Hinweis aktualisiert (Mock / Demonstrationsmodus klar kommuniziert)
- [ ] (Reaktivierung) SharePoint Auth Konzept (Token Flow / Service Principal oder delegated)
- [ ] Gesicherte API-Brücke (Server Proxy) statt direkter Client Calls
- [ ] Konflikt-Merge Strategie (feldbasiert vs last-write-wins) Entscheidungs-Notiz
- [ ] Hintergrund Sync Status UI (letzte erfolgreiche Synchronisation)
- [ ] Delta Sync statt Vollabgleich (Performance)
- [ ] Robuste Fehlerklassifizierung (Netzwerk vs Berechtigung vs Konflikt)

### Next Implementation Choice (Pick one to proceed)

1. Auto-assign Algorithm
2. Toast / Ephemere Benachrichtigungen (mit aria-live)
3. Settings-Seite + Sprache (i18n Scaffold)
4. Feedback Management UI (Filter + Status)
5. Erweiterte A11y Batch (Kontrast, Tooltips, Fokus-Indikatoren)
6. Audit Persistenz & Darstellung
7. Tabellen A11y (Caption, Sort-Hinweise)

Antworte mit einer oder mehreren Nummern (Priorität von links nach rechts) für den nächsten Schritt.

Reply with the number (or multiple numbers in priority order) and I'll implement next.
