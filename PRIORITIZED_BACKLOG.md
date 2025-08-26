# swaxi Dispo Demo – Priorisierter Backlog (Stabilität & swa-CD)

> Ziel: Lokale Demo (ohne Backend) stabil, deterministisch und im **swa-Look** betreiben. Danach schrittweise Add-ons aktivieren.

## 0) Leitplanken (CD & Technik)

- Typo: Primär **Lato** (Light/Regular/Bold), Fallback **Arial** (Office / Windows).
- Farben (Primär):
  - Cyan `#009EE3` (RGB 0,158,227) – Markenfarbe
  - Grün `#AFCA00` (RGB 175,202,0) – Auszeichnung / positive Stati
  - Tinte `#25328A` (RGB 37,50,138) – Nur für Text / Headlines
  - Weiß `#FFFFFF` – Hintergrund
- Sekundärfarben (sparsam): Cyan 30 %, Waldgrün, Beige, Grau, Rot (Fehler).
- Technische Leitplanken: Keine Realtime, kein Backend, deterministische Mock-Daten, Feature-Flags für optionale P2.

---

## P0 – Muss (Stabilität / Demo-sicher)

| Nr | Thema | Kurzbeschreibung | Akzeptanzkriterien | Artefakte / Notizen |
|----|-------|------------------|--------------------|---------------------|
| 1 | Deterministische Seeds & Mock-Persistenz | Gleiche Demo-Daten bei erstem Start, stabile IDs für Tests | (Erfüllt) Snapshot Test grün, stabile Seed-Datei | `seed/initialData.js`, `seedSnapshot.test.js` |
| 2 | ID-Vergabe & Duplikat-Schutz | Zentrale ID-Generierung, Kollisionen verhindert | (Erfüllt) `generateId` persistent + Duplicate Guard in `createShift` | `utils/id.js`, Tests |
| 3 | Zeitraster & Über-Mitternacht-Logik | Shifts dürfen Mitternacht überlappen; Darstellung sauber | (Basis erledigt) Dauerberechnung & Overlap-Tests; UI zeigt Dauer (h) | `utils/shifts.js`, `timeAndConflict.test.js` |
| 4 | Konfliktmatrix (ruhige UI) | Einheitliche Konfliktprüfung statt mehrfacher Flicker | (Basis erledigt) Konfliktcodes + Legend, deterministische Berechnung | `computeShiftConflicts`, `conflicts.js` |
| 5 | Statusmodell & Nebenwirkungen | Definierte Status + Transition Rules | (Erfüllt) Guards + deaktivierte Buttons + Doku | `STATUS.md`, Tests |
| 6 | Arbeitsort-Pflichtfeld | Standort für jede Schicht erforderlich | Shift ohne `location` wird nicht erstellt (val. Fehler); UI Pflichtkennzeichnung; Screenreader Text | Form + Validation Tests |
| 7 | Autosave & Snapshots | Draft-Zwischenspeicher beim Erstellen/Bearbeiten | Abbruch / Reload -> Wiederherstellung möglich; Manuelles "Verwerfen" löscht Draft; Test simuliert Reload | `AutosaveManager` Erweiterung, Tests |
| 8 | UI-Rollen (sichtbare Steuerung) | Sichtbare Anzeige aktiver Rolle + Rollenspezifische Actions | Rolle sichtbar (Badge / Ecke); Aktionen nur für berechtigte Rollen gerendert; Tests per role matrix | UI Badge + Role-based conditional rendering |
| 9 | CD-Theme (Basis) | Farben & Typografie konsistent | Tailwind Config Tokens; Lato Font eingebunden; Visuell 3 Kern-Elemente (Header, Buttons, Tabelle) konform | `tailwind.config.js`, Theming README |


### P0 Fortschritt & Rest

Abgeschlossen: 1,2,3 (Basis),4 (Basis),5

Offen (in Reihenfolge): 6 Arbeitsort-Pflicht, 7 Autosave/Snapshots, 8 UI-Rollenanzeige, 9 CD-Theme Basisschicht

Erweiterungen in Arbeit / geplant:

- Konflikt UX Verfeinerung (Icons, kompakte Darstellung)
- Konflikt-Metadaten (betroffene Shift-IDs)

---

## P1 – Sollte (Add-ons mit geringem Risiko)

| Nr | Thema | Kurzbeschreibung | Akzeptanzkriterien |
|----|-------|------------------|--------------------|
| 1 | Changelog-Sheet | Einfacher Markdown-Verlauf für Demo-Inkremente | Neuer Eintrag pro Iteration automatisiert / Skript |
| 2 | Tooltips (dezent) | Non-intrusive Hilfetexte | Keyboard-Fokus & Hover erreichbar; ARIA konform |
| 3 | Mini-Analytics | Kleine Kennzahlen (Anzahl Schichten, Bewerbungen) | Rendering performant < 5ms rechnerisch (Test Mock) |
| 4 | Kalender-Übersicht Read-only | Monats-/Wochenansicht passiv | Navigation mit Pfeiltasten; Keine Mutation |
| 5 | Serienbewerbung | Mehrfachbewerbung mit Validierung | Konflikte blockieren fehlerfrei; Batch Result Summary |

---

## P2 – Kann (Feature-Flag)

| Nr | Thema | Flag | Kurzbeschreibung |
|----|-------|------|------------------|
| 1 | Live-Update-Banner | `flag_live_banner` | Zeigt Hinweis auf neue Version |
| 2 | Audit-Log (Admin) | `flag_audit_log` | Einsehbare Liste Statusänderungen |
| 3 | Dark-Mode | `flag_dark_mode` | Umschaltbares Farbschema (CD-konform) |
| 4 | Schnellaktionen | `flag_quick_actions` | Tastatur-/Shortcut-Actions |

Feature Flag Mechanismus (einfach): Objekt `window.__FLAGS__` aus `import.meta.env` + Fallback localStorage Override.

---

## Technische Querschnitts-Checks

- Performance: Rendering < 16ms Budget pro Hauptinteraktion (Smoke Test Script)
- Fehlerbilder: Zentraler Logger + konsistente Benutzerhinweise
- Accessibility: WCAG Fokus-Indikatoren, ARIA Labels, Kontrast >= 4.5
- Build-frei: Start nur über `npm run dev` / `npm run preview`
- Feature-Flags: Nicht gesetzte Flags = Codepfad inaktiv (Tree-Shake freundlich)

---

## Abnahmetests (Kurzliste)

1. Seed Repro (Snapshot)
2. ID-Duplikat-Verhinderung
3. Status-Transition Guard
4. Konfliktmatrix deterministisch
5. Mitternacht-Shift Verarbeitung
6. Autosave Wiederherstellung
7. Rollenbasierte UI Sichtbarkeit

---

## Umsetzungshinweise (konkret)

- Theme Tokens in `tailwind.config.js` (colors, fontFamily) → Klasse `font-sans` global.
- Seed: `src/seed/initialData.js` + Export `applyInitialSeedIfEmpty()`.
- ID: `utils/id.js` mit monotonic counter + prefix (z.B. `shf_`). Persistenter Counter in localStorage.
- Konfliktmatrix: reine Funktion → testbar, keine Seiteneffekte.
- Statusmodell: Datei `src/domain/status.js` mit ENUM + `canTransition(from,to)`.
- Autosave: Draft Key `draft_shift_new` + Throttle (500ms) in `AutosaveManager`.
- Rollenanzeige: Komponente `ActiveRoleBadge` rechts im Header / Navigation.
- Feature Flags: Datei `src/config/flags.js` baut Objekt aus `import.meta.env` + localStorage Overrides.

---

## Risiken & Nicht-Ziele

- Kein Realtime Sync, keine externe API Calls
- Keine Drag&Drop Interaktionen (Barrierefreiheit & Komplexität)
- Kein komplexes Konflikt-Merging (nur präventive Matrix)

---
**Stand:** 2025-08-26

---

### Nächste Umsetzung (Vorschlag Sprint 1)

1. Seed & ID Fundament (Stories P0-1, P0-2)
2. Statusmodell + Konfliktmatrix (P0-5, P0-4) – in enger Kopplung
3. Mitternacht & Zeitraster (P0-3)
4. Arbeitsort Pflicht (P0-6)

Lieferziel Sprint 1: Stabiler Kern ohne UI-Flackern, garantierte deterministische Datenbasis.

Sprint 2 (Preview): Autosave & Rollen + Theme Basisschicht.

---

### Definition of Done (P0 Stories)

- Lauffähig (alle Tests grün / neue Tests hinzugefügt)
- Dokumentiert (README Abschnitt oder Inline Doc)
- Keine ESLint / TypeScript (falls später eingeführt) Fehler
- Abnahmetest Liste aktualisiert
