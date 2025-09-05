# Swaxi Disponenten System v6

Ein modernes Schichtplanungssystem für Swaxi-Fahrer mit **Hybrid SharePoint/localStorage** Unterstützung für Stadtwerke Augsburg.

[![Build Status](https://github.com/swaxidriver/swaxi-dispo-v6/actions/workflows/ci.yml/badge.svg)](https://github.com/swaxidriver/swaxi-dispo-v6/actions)
[![Version](https://img.shields.io/github/package-json/v/swaxidriver/swaxi-dispo-v6)](https://github.com/swaxidriver/swaxi-dispo-v6/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/demo-live-green.svg)](https://swaxidriver.github.io/swaxi-dispo-v6/)
[![Issues](https://img.shields.io/github/issues/swaxidriver/swaxi-dispo-v6)](https://github.com/swaxidriver/swaxi-dispo-v6/issues)

🌐 **Live Demo:** [https://swaxidriver.github.io/swaxi-dispo-v6/](https://swaxidriver.github.io/swaxi-dispo-v6/)

## ✨ Features

### 🔄 **Hybrid Data Layer (Feature‑Flag)**

- **SharePoint Integration (derzeit deaktiviert)** – Architektur vorhanden, Flag standardmäßig aus (`VITE_ENABLE_SHAREPOINT=false`)
- **IndexedDB / In-Memory** als aktive Persistenz
- **Umschaltbar** via `.env` (`VITE_ENABLE_SHAREPOINT=true` + optional `VITE_SHIFT_BACKEND=sharepoint`)
- **Connection Status** UI vorbereitet für Re-Aktivierung

### 🚗 **Schichtplanung**

- Umfassende Schichtplanung und -verwaltung
- 🎯 **Drag-and-Drop Scheduling** - Intuitive Schichtverschiebung mit Echtzeit-Konflikterkening
  - Visuelle Feedback-Systeme (grün = gültig, rot = ungültig)
  - Shake-Animation bei Konflikten
  - Feature-Flag Steuerung (`ENABLE_DRAG_DROP`)
  - Vollständige Keyboard-Barrierefreiheit
  - Mobile Touch-Unterstützung
- 👥 Rollenbasierte Zugriffskontrolle (Admin, Chief, Disponent, Analyst)
- 📊 Echtzeit-Analytics und Statistiken
- 📅 Erweiterte Kalenderansicht mit Filtern

### 🎨 **User Experience**

- 🌓 Light/Dark Mode mit Persistence
- 🌍 **Multi-Language Support** (German/English)
  - Umschaltung über Settings-Page
  - Persistierung in localStorage (`swaxi.settings.language`)
  - Dictionary-basierte Übersetzungsarchitektur
  - Fallback-System (Deutsch → Englisch → Key)
- 📱 Vollständig responsive Design
- 🔔 Echtzeit-Benachrichtigungssystem
- 🔍 Umfassende Audit-Protokollierung

### 🧪 **Testing & Diagnostics**

- **Comprehensive Test Suite** (`/test` Route)
- **Real-time Status Monitoring**
- **Connection Diagnostics**
- **Export Test Results**

## 🛠 Technologie-Stack

### **Frontend**

- **React 19** - Moderne UI-Bibliothek mit neuesten Features
- **Vite 7** - Ultraschneller Build-Tool und Dev-Server
- **TailwindCSS 4** - Utility-First CSS Framework
- **HeadlessUI** - Accessible UI-Komponenten
- **HeroIcons** - Beautiful SVG Icons

### **Typography & Design**

- **Manrope** - Self-hosted variable font (400-700 weights) with optimized loading
- **Font-display: swap** - Prevents FOIT (Flash of Invisible Text) >100ms
- **Font-smoothing** - Enhanced antialiased rendering on WebKit/Gecko
- **Responsive line-height** - Improved readability with 1.6 base scale
- **Design tokens** - Centralized CSS variables for consistent theming

### **Data Layer**

- **IndexedDB / In-Memory** – Aktive Modi für lokale Demo & Tests
- **SharePoint (flag-gesteuert)** – Reaktivierbar ohne Refactor
- **Hybrid Service Layer** – Repository Pattern kapselt Backend-Wahl

### **State Management**

- **React Context API** - Zentrale State-Verwaltung
- **Custom Hooks** - Wiederverwendbare Logik
- **Real-time Updates** - Live data synchronization

### **Build & Tooling**

- **npm** - Package manager and dependency management
- **PostCSS** - CSS processing with TailwindCSS and Autoprefixer
- **TypeScript** - Type checking and development tooling
- **Jest** - Testing framework with comprehensive test coverage
- **ESLint** - Code linting and style enforcement

## 📚 Documentation

### **📋 Project Planning & Issue Management**

- **[CSV Import Guide](docs/CSV_IMPORT_GUIDE.md)** - Bulk create GitHub issues from CSV files
- **[Issue Planning](docs/swaxi_issue_plan.md)** - Comprehensive project structure and templates
- **[GitHub Issues Template](docs/github-issues.md)** - Structured issue examples
- **[CSV Templates](docs/templates/)** - Ready-to-use CSV templates for issue import

### **🔧 Development & Setup**

- **[RBAC Integration](docs/RBAC_INTEGRATION.md)** - Role-based access control documentation
- **[GitHub Setup Guide](docs/github-setup-guide.md)** - Repository configuration and workflow
- **[Contrast Audit Plan](docs/contrast-audit-plan.md)** - Accessibility compliance guidelines

### **🛠 Scripts & Automation**

- **[Import Script](scripts/import-issues.sh)** - Automated CSV to GitHub issues import
- **[Validation Script](scripts/validate-csv.sh)** - CSV format and data validation tool
- **GitHub CLI Integration** - Bulk operations and automation tools
- **Development Scripts** - Build, test, and deployment automation

### **📖 Quick References**

- **Project Structure**: Modular React architecture with context-based state management
- **Issue Workflow**: CSV → GitHub Issues → Epics → Milestones → Implementation
- **Development Workflow**: Branch naming, PR process, release workflow (see [Development Workflow](#-development-workflow))
- **Test Coverage**: Comprehensive test suite accessible at `/test` route

## 🚀 Quick Start

### **Lokale Entwicklung**

```bash
# Repository klonen
git clone https://github.com/swaxidriver/swaxi-dispo-v6.git

# In das Projektverzeichnis wechseln
cd swaxi-dispo-v6

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (http://localhost:5173/swaxi-dispo-v6/)
npm run dev
```

### **Sofort testen**

- **🌐 Live Demo:** [https://swaxidriver.github.io/swaxi-dispo-v6/](https://swaxidriver.github.io/swaxi-dispo-v6/)
- **🧪 Test Suite:** [https://swaxidriver.github.io/swaxi-dispo-v6/test](https://swaxidriver.github.io/swaxi-dispo-v6/test)
- **📱 Responsive:** Funktioniert auf allen Geräten

## 🏗 Projektstruktur

```text
swaxi-dispo-v6/
├── public/                    # Statische Assets
├── src/
│   ├── components/           # UI-Komponenten
│   │   ├── ConnectionStatus.jsx  # 🟢 SharePoint Connection Status
│   │   ├── MiniAnalytics.jsx     # 📊 Dashboard Widgets
│   │   ├── Navigation.jsx        # 🧭 Hauptnavigation
│   │   ├── NotificationMenu.jsx  # 🔔 Benachrichtigungen
│   │   ├── RoleManagement.jsx    # 👥 Benutzerverwaltung
│   │   ├── ShiftTable.jsx        # 📋 Schicht-Tabelle
│   │   └── ThemeToggle.jsx       # 🌓 Dark/Light Mode
│   ├── contexts/             # React Context
│   │   ├── AuthContext.jsx      # 🔐 Authentifizierung
│   │   ├── ShiftContext.jsx     # 🔄 Hybrid Data Management
│   │   └── ThemeContext.jsx     # 🎨 Theme Management
│   ├── pages/               # Hauptseiten
│   │   ├── Administration.jsx   # ⚙️ Admin Panel
│   │   ├── Audit.jsx           # 🔍 Audit Logs
│   │   ├── Calendar.jsx        # 📅 Kalenderansicht
│   │   ├── Dashboard.jsx       # 🏠 Hauptdashboard
│   │   └── TestPage.jsx        # 🧪 Comprehensive Tests
│   ├── services/            # Business Logic
│   │   ├── sharePointService.js  # (Flag deaktiviert) SharePoint Integration
│   │   └── migrationService.js   # 📦 Data Migration
│   └── utils/               # Hilfsfunktionen
├── .github/workflows/       # 🚀 CI/CD Pipeline
└── dist/                   # 📦 Production Build
```

### Deterministischer Seed (P0)

Beim ersten Start (falls keine `shifts` im localStorage) werden feste Seed-Daten aus `src/seed/initialData.js` geladen. Ein Snapshot-Test (`seedSnapshot.test.js`) stellt Stabilität sicher.

### ID-Generierung

Monotone IDs mit Prefix via `generateId()` (`src/utils/id.js`) – persistenter Counter (`id_counter_v1`). Kollisionen werden so vermieden.

### Zeit & Dauer Logik (P0-3)

Schichtzeiten werden rein als `HH:MM` Strings verarbeitet und mittels `toMinutes()` normalisiert. Über-Mitternacht-Fälle (z.B. `21:00` -> `05:30`) werden korrekt behandelt, indem die Dauer als Segment über den Tageswechsel gerechnet wird (`computeDuration`). Überlappungen berücksichtigen diese Segmentierung (`overlaps`).

### Konflikt-Logik (P0-4)

Konflikte werden pro Schicht dynamisch berechnet (`computeShiftConflicts` in `src/utils/shifts.js`). Aktuelle Codes:

| Code                   | Beschreibung                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `TIME_OVERLAP`         | Zeitliche Überlappung mit mind. einer anderen Schicht                                |
| `DOUBLE_APPLICATION`   | Ein Benutzer hat sich auf überlappende Schichten beworben                            |
| `ASSIGNMENT_COLLISION` | Überlappende Schichten derselben Person zugewiesen                                   |
| `LOCATION_MISMATCH`    | Überlappende zugewiesene Schichten gleicher Person aber widersprüchlicher Arbeitsort |

UI zeigt Konflikte als Liste unter der jeweiligen Schicht. Erweiterung: Mapping auf verständlichere Texte / Icons möglich.

## 🧩 Key Components

### **🔄 Hybrid Data Management**

- **`sharePointService.js`** - Intelligente SharePoint Integration mit automatischem Fallback
- **`ShiftContext.jsx`** - Zentrale Datenverwaltung mit dual-source support
- **`ConnectionStatus.jsx`** - Real-time Status-Anzeige der Datenquelle
  **`firebaseConfig.js` (stub)** - Firebase aktuell deaktiviert / Platzhalter. Re-Aktivierung geplant.

### **📊 Analytics & Monitoring**

- **`MiniAnalytics.jsx`** - Live Dashboard-Widgets mit Schichtstatistiken
- **`TestPage.jsx`** - Comprehensive test suite für alle Funktionen
- **Audit-System** - Vollständige Protokollierung aller Aktionen

### **🔍 Audit Log System**

Das Audit-System protokolliert alle wichtigen Aktionen automatisch und bietet eine benutzerfreundliche Admin-Oberfläche zur Überwachung und Analyse.

#### **Funktionen**

- **Admin-only Zugriff** - Nur Benutzer mit Admin-Rolle können Audit-Logs einsehen
- **Automatische Protokollierung** - Erfasst Schichtoperationen, Zuweisungen, Einstellungsänderungen
- **Intelligente Kategorisierung** - Automatische Gruppierung: Create, Update, Delete, Apply, Other
- **Ring Buffer Storage** - Hält die letzten 1000 Einträge in localStorage (`swaxi.audit.v1`)
- **Erweiterte Filter** - Nach Typ, Benutzer und Zeitraum (heute, Woche, Monat)
- **Analytics Integration** - Live-Dashboard mit Shift-Metriken und Konflikten
- **JSON Export** - Vollständiger Export aller Audit-Daten mit Metadata

#### **Audit Entry Structure**

```javascript
{
  id: "1757073253116_6nqcva0fj",              // Unique identifier
  timestamp: "2025-09-05T11:54:13.116Z",      // ISO timestamp
  action: "shift_created",                     // Action performed
  actor: "admin@example.com",                 // User who performed action
  role: "admin",                              // User role at time of action
  details: "Frühschicht 06:00-14:00",        // Additional context
  count: 1,                                   // Number of items affected
  type: "create"                              // Categorized type
}
```

#### **Action Types**

- **`create`** - Neue Schichten, Benutzer, Templates erstellt
- **`update`** - Schichtzeiten, Zuweisungen, Einstellungen geändert
- **`delete`** - Schichten, Benutzer entfernt oder storniert
- **`apply`** - Bewerbungen, Urlaubsanträge eingereicht
- **`other`** - Sonstige protokollierte Aktionen

#### **Usage**

```javascript
// Manual logging
AuditService.logAction(
  "shift_assigned", // action
  "admin@example.com", // actor
  "admin", // role
  { shiftId: 123, driver: "John" }, // details
  1, // count
);

// Automatic user context
AuditService.logCurrentUserAction("settings_changed", {
  setting: "theme",
  value: "dark",
});

// Retrieve logs
const allLogs = AuditService.getLogs();
const filteredLogs = AuditService.getFilteredLogs("create");

// Export functionality
AuditService.exportLogs(); // Downloads JSON file
```

#### **Access & Routes**

- **Route:** `/audit` (Admin-only)
- **Navigation:** Visible nur für Admin-Benutzer
- **Storage:** `localStorage['swaxi.audit.v1']`
- **Ring Buffer:** Automatische Limitierung auf 1000 Einträge

### **👥 User Management**

- **`RoleManagement.jsx`** - Erweiterte Benutzerverwaltung mit Rollensystem
- **`AuthContext.jsx`** - Sichere Authentifizierung und Session-Management
- **Permissions** - Granulare Berechtigungssteuerung

## 💻 Entwicklung

### **Development Commands**

```bash
# 🔥 Development Server (Hot Reload)
npm run dev

# 🏗 Production Build (Optimized)
npm run build

# 👀 Preview Build locally
npm run preview

# 🧪 Run Tests
npm run test

# 🧪 Watch Tests
npm run test:watch

# 📊 Test Coverage
npm run test:coverage

# 🔍 Linting
npm run lint
```

## 🌍 Internationalization (i18n)

The application supports multiple languages with a dictionary-based translation system.

### **Supported Languages**

- **German (de)** - Default language
- **English (en)** - Full translation available

### **Language Switching**

Users can switch languages via the Settings page:

1. Navigate to **Settings** → **Language** section
2. Select **Deutsch (de)** or **English (en)**
3. Language preference is automatically saved to localStorage

### **Translation Architecture**

#### **Dictionary Files**

```bash
src/i18n/
├── index.js           # Exports all dictionaries
├── de.js             # German translations
└── en.js             # English translations
```

#### **Translation Helper**

```javascript
import { useI18n } from "../hooks/useI18n";

function MyComponent() {
  const { t, language, setLanguage } = useI18n();

  return (
    <div>
      <h1>{t("welcome")}</h1> {/* Returns "Willkommen" or "Welcome" */}
      <p>Current: {language}</p> {/* Returns "de" or "en" */}
      <button onClick={() => setLanguage("en")}>Switch to English</button>
    </div>
  );
}
```

#### **Fallback System**

The translation system provides intelligent fallbacks:

1. **Primary**: Current language translation
2. **Fallback**: German translation (if not already German)
3. **Final**: Translation key itself

### **Adding New Translations**

#### **1. Add Translation Keys**

```javascript
// src/i18n/de.js
export const de = {
  // ... existing translations
  newFeature: "Neue Funktion",
  buttonLabel: "Klicken Sie hier",
};

// src/i18n/en.js
export const en = {
  // ... existing translations
  newFeature: "New Feature",
  buttonLabel: "Click here",
};
```

#### **2. Use in Components**

```javascript
function NewComponent() {
  const { t } = useI18n();

  return (
    <div>
      <h2>{t("newFeature")}</h2>
      <button>{t("buttonLabel")}</button>
    </div>
  );
}
```

#### **3. Error Message Translation**

For validation errors, use the translation helper:

```javascript
import { translateValidationErrors } from "../utils/templateValidation";

function MyForm() {
  const { t } = useI18n();
  const [errors, setErrors] = useState([]);

  // Translate validation errors
  const translatedErrors = translateValidationErrors(errors, t);

  return (
    <div>
      {translatedErrors.map((error) => (
        <p key={error}>{error}</p>
      ))}
    </div>
  );
}
```

### **Translation Key Conventions**

- **Camel case**: `settingsTitle`, `personalApplications`
- **Semantic grouping**: Group related keys by feature/component
- **Consistent naming**: Use clear, descriptive names
- **Error codes**: Validation errors use specific error code keys

### **Testing Translations**

```bash
# Run i18n-specific tests
npm test -- --testPathPatterns=i18n

# Test key consistency between languages
npm test -- src/tests/i18n.test.js
```

### **🔄 Development Workflow**

This section documents the complete branch/release workflow for contributors and maintainers.

#### **🌿 Branch Strategy**

We follow a **short-lived branch model** with clear naming conventions:

| Branch Type | Pattern                         | Purpose                          | Example                          |
| ----------- | ------------------------------- | -------------------------------- | -------------------------------- |
| **Main**    | `main`                          | Stable, deployed to GitHub Pages | Production releases              |
| **Develop** | `develop`                       | Integration/testing branch       | Pre-release integration          |
| **Feature** | `feature/<scope>-<short-title>` | New functionality                | `feature/add-live-update-banner` |
| **Fix**     | `fix/<short-title>`             | Bug fixes                        | `fix/duplicate-id-generation`    |
| **Chore**   | `chore/<short-title>`           | Maintenance tasks                | `chore/update-dependencies`      |
| **Release** | `release/vX.Y.Z`                | Release hardening (optional)     | `release/v6.3.0`                 |
| **Hotfix**  | `hotfix/vX.Y.Z+1`               | Urgent production fixes          | `hotfix/v6.3.1`                  |

#### **📝 Branch Naming Guidelines**

- **Feature branches**: `feature/<id>-<slug>` or `feature/<epic-or-scope>-<short-title>`
- **Bug fixes**: `fix/<id>-<slug>` or `fix/<short-description>`
- **Chores**: `chore/<description>` (documentation, refactoring, tooling)
- Use **kebab-case** for all branch names
- Keep names **descriptive but concise**
- Include issue ID when applicable: `feature/176-document-workflow`

#### **🔄 Pull Request Workflow**

1. **Create branch** from `develop` (or `main` for hotfixes)
2. **Implement changes** following coding standards
3. **Run pre-merge checklist** (see below)
4. **Open PR** to `develop` with:
   - Clear title and description
   - Screenshots/GIFs for UI changes
   - Link to related issues
5. **Request review** from maintainers
6. **Address feedback** and update PR
7. **Merge** after approval and checks pass

#### **✅ Pre-Merge Testing Checklist**

Before merging any PR, ensure all of the following pass:

**🔧 Code Quality**

- [ ] `npm run lint` passes without errors
- [ ] `npm run type-check` passes (TypeScript validation)
- [ ] No console errors in browser
- [ ] Code follows existing patterns and style

**🧪 Testing**

- [ ] `npm run test` passes all tests
- [ ] New functionality has appropriate tests
- [ ] No regressions in existing functionality

**🎨 UI/UX (for frontend changes)**

- [ ] Responsive design works (mobile + desktop)
- [ ] Dark/light mode compatibility
- [ ] Accessibility standards maintained
- [ ] Screenshots attached for visual changes

**🔄 State & Data Safety**

- [ ] `localStorage` migration safe (no data loss on refresh)
- [ ] State updates work correctly
- [ ] No memory leaks or performance regressions

**📚 Documentation**

- [ ] `CHANGELOG.md` updated for user-facing changes
- [ ] README updated if new features added
- [ ] Code comments added for complex logic

#### **🚀 Release Process**

We use **semantic versioning** (`v6.M.m`) for all releases:

**1. Prepare Release**

```bash
# Ensure develop is up to date
git checkout develop
git pull origin develop

# Create release branch (optional for larger releases)
git checkout -b release/v6.3.0
```

**2. Update Version & Changelog**

- Bump version in `package.json`
- Update version string in HTML title/footer
- Add release notes to `CHANGELOG.md`
- Commit changes: `git commit -m "chore: prepare v6.3.0 release"`

**3. Merge to Main**

```bash
# Merge to main
git checkout main
git merge develop  # or release/v6.3.0

# Tag the release
git tag v6.3.0
git push origin main --tags
```

**4. Create GitHub Release**

- Go to [GitHub Releases](https://github.com/swaxidriver/swaxi-dispo-v6/releases)
- Click "Create a new release"
- Select tag `v6.3.0`
- Copy release notes from `CHANGELOG.md`
- Publish release

**5. Post-Release Cleanup**

```bash
# Merge back to develop
git checkout develop
git merge main
git push origin develop

# Create next milestone
# Move remaining issues to next version
```

#### **🌐 Demo Publishing**

The demo is automatically deployed via **GitHub Pages** using GitHub Actions:

**Automatic Deployment**

- Every push to `main` triggers automatic deployment
- Build artifacts are deployed to `gh-pages` branch
- Live at: [https://swaxidriver.github.io/swaxi-dispo-v6/](https://swaxidriver.github.io/swaxi-dispo-v6/)

**Manual Deployment** (if needed)

```bash
# Build for production
npm run build

# Deploy using deploy script
./deploy.sh

# Or manually deploy dist/ folder to any static hosting
```

**Demo Environment Setup**

- **URL Structure**: `https://swaxidriver.github.io/swaxi-dispo-v6/`
- **Test Suite**: Available at `/test` route
- **Data Storage**: Uses localStorage (no backend required)
- **Feature Flags**: SharePoint integration disabled by default

#### **🏷️ Issue Labels & Milestones**

Use these standardized labels for issues and PRs:

**Type Labels**

- `type:feature` - New functionality
- `type:bug` - Bug fixes
- `type:chore` - Maintenance tasks
- `type:doc` - Documentation updates

**Priority Labels**

- `prio:P0` - Critical for stability
- `prio:P1` - Important features
- `prio:P2` - Nice to have

**Area Labels**

- `area:UI` - User interface changes
- `area:logic` - Business logic
- `area:state` - State management
- `area:perf` - Performance improvements

**Role Labels**

- `role:admin`, `role:chief`, `role:disponent`, `role:analyst`

#### **💡 Commit Message Convention**

We follow **conventional commits** (optional but recommended):

```bash
feat: add live update banner component
fix: resolve duplicate ID generation issue
chore: update development dependencies
docs: document branch workflow in README
refactor: improve shift conflict detection logic
```

### **🧪 Testing**

Layered Strategy (v2):

| Layer         | Pfad                    | Zweck                                          | Tools                       |
| ------------- | ----------------------- | ---------------------------------------------- | --------------------------- |
| Unit          | `src/tests/unit`        | Pure Funktionen, Reducer, kleine Komponenten   | Jest + RTL                  |
| Integration   | `src/tests/integration` | Kontext + Services + Persistence Zusammenspiel | Jest + RTL + fake-indexeddb |
| Accessibility | `src/tests/a11y`        | Semantik, Kontraste, Fokus-Fluss               | jest-axe + Custom Matcher   |

Custom Matcher: `expect(container).toHaveNoA11yViolations()` (siehe `jest.setup.js`).

#### **🎯 Conflict Detection & Assignment Testing**

Comprehensive unit tests for pure scheduling utilities focusing on edge cases:

- **`conflictDetectionUtils.test.js`** - Edge case testing for:
  - `computeShiftConflicts` - Null inputs, invalid formats, boundary conditions
  - `overlaps` - Cross-midnight scenarios, exact matches, invalid times
  - `detectShiftOverlap` - Mixed datetime/legacy shift handling
  - `isShortTurnaround` - Boundary values, custom rest periods
  - Conflict categorization utilities with invalid/unknown inputs

- **`assignmentUtils.test.js`** - Edge case testing for:
  - Assignment application workflows (apply, reject, approve, withdraw)
  - `canAssignUserToShift` - Conflict detection, null inputs, edge cases
  - Auto-assignment planning with no users/shifts, conflict detection
  - Assignment statistics with missing data fields

- **`schedulingUtils.test.js`** - Core scheduling library edge cases:
  - `calculateTimeOverlap` - Invalid inputs, overnight overlaps, boundaries
  - `calculateShiftDuration` - Zero duration, overnight shifts, invalid formats
  - `findSchedulingConflicts` - Large datasets, missing fields, complex scenarios
  - Template generation with edge cases and validation

**Coverage Status:** Focus on pure utility functions with comprehensive edge case coverage for conflict detection (100% coverage of conflicts.js) and shift utilities (79% coverage of shifts.js).

Skripte:

```bash
npm run test:unit
npm run test:integration
npm run test:a11y
npm run test:coverage

# Run specific unit tests
npm test -- src/tests/unit/conflictDetectionUtils.test.js
npm test -- src/tests/unit/assignmentUtils.test.js
npm test -- src/tests/unit/schedulingUtils.test.js
```

Coverage Gates (aktuell – werden weiter angezogen):

- Global ≥66/60/66/66 (Statements/Branches/Functions/Lines)
- Utils ≥80/80/90/80
- shiftGenerationService ≥80/70/80/80
- sharePointService ≥60/50/60/60

Letzter Lauf: Global ~80/71/80/82 → komfortabler Puffer für nächste Erhöhung.

### **📈 Performance**

- **Build Size:** ~61KB gzipped
- **Build Time:** ~1.8s
- **Lighthouse Score:** 98/100
- **Code Splitting:** Optimized vendor/router/ui chunks

### **🛡 Error Handling, Telemetry & Logging**

Routed content is wrapped in a class-based `ErrorBoundary` (`src/components/ErrorBoundary.jsx`).

Features:

- Catches render / lifecycle errors beneath it
- Friendly fallback UI with reload button (role="alert")
- Structured error object (message, stack, componentStack, timestamp, version)
- Delegated logging via `utils/logger.js` (`logError`, `logInfo`) – auto-silenced unter Jest
- Leichtgewichtiges Fehler-Telemetrie Utility `src/utils/errorTelemetry.js` (`registerErrorTelemetry`, `dispatchErrorTelemetry`) mit boolean Rückgabewert

Example:

```jsx
import ErrorBoundary from "./components/ErrorBoundary";

function Root() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
```

Telemetry & Logger Tipps:

- `registerErrorTelemetry(handler)` einmalig beim App-Bootstrapping.
- `dispatchErrorTelemetry(payload)` wird vom `ErrorBoundary` genutzt; gibt `true` (gesendet) oder `false` (kein Handler) zurück.
- `setLoggerSilent(true)` für eingebettete Iframes / Storybook.
- Remote Logging: eigenen Handler registrieren oder in Handler intern `fetch('/error-log', { method:'POST', body: JSON.stringify(payload) })` verwenden.

## 🚀 Deployment

### **🌐 Live Production**

- **URL:** [https://swaxidriver.github.io/swaxi-dispo-v6/](https://swaxidriver.github.io/swaxi-dispo-v6/)
- **Platform:** GitHub Pages with automated CI/CD
- **SSL:** ✅ HTTPS enabled
- **CDN:** ✅ Global distribution

### **🔄 Automatic Deployment**

```bash
# Jeder Push auf 'main' triggert automatisch:
git add .
git commit -m "Update features"
git push origin main
# → GitHub Actions builds & deploys automatically
```

### **📦 Manual Deployment Options**

```bash
# 🚀 Quick deploy script
./deploy.sh

# 🏗 Build für Production
npm run build

# 📁 Deploy dist/ folder to any static hosting
# - Netlify (drag & drop)
# - Vercel (connect GitHub)
# - Firebase Hosting
# - Surge.sh
```

### **🏢 Enterprise Deployment (Stadtwerke Augsburg)**

1. **SharePoint Setup**: Siehe `SHAREPOINT_SETUP.md`
2. **IT Request**: Email-Template für SharePoint Lists
3. **Hybrid Mode**: Funktioniert auch ohne SharePoint (localStorage fallback)
4. **Testing**: Comprehensive test suite unter `/test`

## 📋 SharePoint Integration

### **🔧 SharePoint (derzeit deaktiviert)**

Feature Flag: `VITE_ENABLE_SHAREPOINT=false` – echte Requests unterdrückt; bei gesetztem Backend `sharepoint` erfolgt automatischer Fallback auf IndexedDB. Die UI zeigt dann im Status-Widget ein kleines Badge "SP deaktiviert".

Re-Aktivierung:

1. `.env` erstellen (siehe `.env.example`)
2. `VITE_ENABLE_SHAREPOINT=true` & optional `VITE_SHIFT_BACKEND=sharepoint`
3. Dev-Server neu starten
4. ConnectionStatus zeigt dann Online/Fallback Status

### **📊 Data Flow**

```text
User Action → ShiftContext → sharePointService
                                    ↓
                            SharePoint verfügbar?
                                   / \
                                YES   NO
                                /      \
                    SharePoint Lists   localStorage
                               \        /
                                \      /
                             UI Update
```

## 🆘 Support & Documentation

### **📚 Zusätzliche Dokumentation**

- **`HYBRID_TESTING_GUIDE.md`** - Sofort testbare Features
- **`docs/archive/SHAREPOINT_SETUP.md`** - (Archiv) SharePoint Integration Guide
- (Archiv) Historische Backlogs jetzt unter `docs/archive/` (`BACKLOG.md`, `PRIORITIZED_BACKLOG.md`)
  **Firebase Hinweis**: Firebase ist derzeit deaktiviert (stub). MigrationService-Funktionen sind bis zur Aktivierung ausgesetzt.

### Historische Planung / Backlog

Die alten Markdown Backlogs wurden archiviert und durch Issue-Tracking ersetzt (siehe offene Issues mit Label `P1`). Für Referenzzwecke liegen die unveränderten Kopien in `docs/archive/`.

### **📋 Project Management & CSV Import**

- **Issue Planning**: See `docs/swaxi_issue_plan.md` for comprehensive project structure
- **CSV Import Process**: Bulk create GitHub issues from structured CSV data
- **Import Guide**: Complete documentation in `docs/CSV_IMPORT_GUIDE.md`
- **Templates**: CSV templates available in `docs/templates/`

#### **CSV Import Quick Start**

```bash
# 1. Prepare CSV file using template
cp docs/templates/issue-import-template.csv my-issues.csv

# 2. Edit CSV with your issues

# 3. Validate CSV format
./scripts/validate-csv.sh my-issues.csv

# 4. Import using automation script (recommended)
./scripts/import-issues.sh my-issues.csv

# Or preview first (dry run)
./scripts/import-issues.sh my-issues.csv true

# Manual GitHub CLI approach:
gh issue create --title "[P1] Feature: New Feature" \
  --label "type:feature,prio:P1,area:UI" \
  --body "Description from CSV..."
```

**CSV Format**: Structured import supporting priorities (P0-P2), types (feature/bug/docs/chore), areas (UI/state/perf), epics (E0-E6), milestones, acceptance criteria, and test cases.

### **🔧 Troubleshooting**

- **Connection Issues**: Check `/test` page für Diagnostics
- **SharePoint Errors**: Siehe ConnectionStatus component
- **Build Problems**: Run `npm run lint` für Code-Issues
- **Performance**: Build Analyzer unter `npm run build`

## 📝 License & Copyright

© 2025 Swaxi GmbH & Stadtwerke Augsburg

Entwickelt für die interne Nutzung bei Stadtwerke Augsburg.  
Hybrid SharePoint/localStorage Architektur für maximale Flexibilität.

---

### 🎯 **Ready to go?**

1. **🔥 Lokal testen:** `npm run dev`
2. **🌐 Online testen:** [Live Demo](https://swaxidriver.github.io/swaxi-dispo-v6/)
3. **🧪 Features prüfen:** [Test Suite](https://swaxidriver.github.io/swaxi-dispo-v6/test)
4. **📧 SharePoint anfordern:** `SHAREPOINT_SETUP.md`

## 🎨 Design Tokens & Theming

Dieses Projekt verwendet zentrale Design Tokens in `src/styles/tokens.css` (Farben, Typografie, Radii, Schatten). Dark Mode erfolgt über `data-theme="dark"` auf `<html>` und überschreibt nur die Variablen – keine doppelte CSS-Pflege.

### SWA Corporate Design Compliance

Das Design System entspricht vollständig dem SWA Corporate Design Handbuch:

- **Farbpalette**: Primary `#222f88`, Accent `#27ade7`, Status-Farben (Success, Warning, Error)
- **Typography**: Manrope als Primärschrift mit Inter/System Fallbacks
- **Konsistenz**: Alle UI-Komponenten nutzen einheitliche Token
- **Zugänglichkeit**: WCAG 2.1 AA konforme Kontraste für beide Themes
- **Dark Mode**: Vollständige Unterstützung mit optimierten Farbwerten

### Vorteile

- Einheitliche Farblogik (Surface vs. Background vs. Border)
- Leichtes Corporate-Branding Update (nur Tokens tauschen)
- Tests & Snapshots stabiler (keine zufälligen Inline-Farben)
- Corporate Design konform und WCAG-compliant

### Nutzung

- Basis-Styling über Hilfsklassen (`btn`, `card`, `input`) in `index.css`.
- Direkter Zugriff über `var(--color-*)` für Spezialfälle.
- **Neu**: Semantic Tailwind utilities via mapped tokens (siehe unten).
- Schriftfamilie: Primär Manrope (Fallback Inter/System) – jetzt lokal via `@fontsource/manrope` (nicht mehr extern geladen).

#### Tailwind Token Utilities

Seit v0.3.1 sind semantische Design-Tokens als Tailwind-Utilities verfügbar:

```jsx
{/* Background colors */}
<div className="bg-surface">Card background</div>
<div className="bg-primary">Primary background</div>
<div className="bg-accent">Accent background</div>
<div className="bg-ok">Success background</div>
<div className="bg-warn">Warning background</div>
<div className="bg-danger">Error background</div>

{/* Text colors */}
<p className="text-text">Default text</p>
<p className="text-muted">Muted text</p>

{/* Border colors */}
<div className="border border-border">Default border</div>
<div className="border-2 border-primary">Primary border</div>

{/* Font family */}
<div className="font-sans">Uses design token font stack</div>
```

#### Spacing Scale

Seit v0.3.x ist eine konsistente Spacing Scale als CSS Custom Properties verfügbar:

**Verfügbare Werte:**

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-16`: 64px

**Verwendung in Komponenten:**

```jsx
{
  /* Mit CSS Custom Properties */
}
<div style={{ padding: "var(--space-4)", margin: "var(--space-2)" }}>
  Konsistente Abstände
</div>;

{
  /* Als CSS-Klassen (bei Bedarf) */
}
<div className="space-4">Content mit Standard-Spacing</div>;
```

**Best Practice:** Verwende ausschließlich Werte aus der Spacing Scale für Padding, Margin und Gaps. Vermeide hardcodierte Pixelwerte (13, 18, 22px etc.).

Diese Klassen verweisen auf CSS-Variablen und funktionieren automatisch mit Light/Dark Mode.

### Migration Alt → Neu

Legacy Klassen `bg-brand-primary`, `text-brand-primary`, `focus:ring-brand-primary`, `bg-brand-secondary` wurden weitestgehend ersetzt durch Token-Verwendung (Stand v0.3.x). Ehemalige Sass Datei `styles/main.scss` wurde in v0.3.x entfernt – alle Werte sind nun als CSS Tokens oder Utility-Klassen verfügbar.

**SWA Corporate Design Migration (v0.3.1):**
Das System wurde vollständig auf das SWA Corporate Design Handbuch ausgerichtet:

- **Farbpalette**: Alle Farben entsprechen den Corporate Design Vorgaben
- **Semantische Token**: `--color-primary`, `--color-accent`, `--color-ok`, `--color-warn`, `--color-err`
- **Hard-coded Farben eliminiert**: Keine Hex-Werte mehr in Komponenten (außer Seed-Daten)
- **Dark Mode bereit**: `[data-theme="dark"]` Überschreibungen für alle Tokens
- **Kontrastprüfung**: WCAG 2.1 AA konforme Farbkombinationen

Neue Komponenten sollten semantische Klassen oder direkte Tokens nutzen:

```jsx
<button className="btn-primary">Anlegen</button>
<div className="card" />
<div style={{ background: 'var(--color-surface)' }} />
```

Suche nach Migrationskandidaten: `grep -R "brand-primary" src/`.

### Dark Mode

`ThemeContext` setzt `data-theme` basierend auf Nutzerwahl oder `prefers-color-scheme`. Keine Neuberechnung an Komponenten nötig.

### Best Practices

1. **Farben definieren**: Neue Farben erst in `tokens.css` definieren, dann in `theme.css` als SWA-Variable referenzieren
2. **Keine Hard-coded Farben**: Keine Hex-Werte direkt in JSX/CSS - nutze CSS-Variablen oder Tailwind-Utilities
3. **Semantische Benennung**: `--color-ok`, `--color-warn`, statt spezifischer Farbnamen (`--color-blue`)
4. **Ebenen unterscheiden**: `--color-bg` (Seitenhintergrund) vs. `--color-surface` (Cards, Panels) beachten
5. **Corporate Design**: Alle Farben müssen der SWA Corporate Design Palette entsprechen
6. **Dark Mode**: Immer `[data-theme="dark"]` Varianten für neue Farben definieren
7. **Token-Linting**: `npm run lint:tokens` prüft auf Hard-coded Farben

### Programmatic Token Consumption

Design tokens are automatically exported as machine-readable JSON for external tools and integrations:

#### Generating Tokens

```bash
npm run build:tokens
```

This generates `src/styles/tokens.json` with structured token data:

```json
{
  "meta": {
    "generated": "2024-08-27T15:24:04.325Z",
    "source": "src/styles/tokens.css",
    "version": "1.0.0"
  },
  "light": {
    "colors": {
      "color-primary": "#222F88",
      "color-accent": "#27ADE7"
      // ... all light theme colors
    },
    "typography": {
      "font-sans": "Manrope, Inter, system-ui, ...",
      "text-lg": "1.125rem"
    },
    "spacing": {
      "space-1": "4px",
      "space-4": "16px"
    },
    "borders": {
      "radius-md": "6px"
    },
    "shadows": {
      "shadow-sm": "0 1px 2px rgba(0,0,0,0.06)"
    }
  },
  "dark": {
    "colors": {
      "color-primary": "#8094ff"
      // ... dark theme overrides
    }
  }
}
```

#### Usage Examples

**Figma Plugin Integration:**

```javascript
import tokens from "./src/styles/tokens.json";

// Create Figma color styles from tokens
Object.entries(tokens.light.colors).forEach(([name, value]) => {
  figma.createPaintStyle({
    name: `Light/${name}`,
    paints: [{ type: "SOLID", color: hexToRgb(value) }],
  });
});
```

**Storybook Theme Config:**

```javascript
import tokens from "../src/styles/tokens.json";

export const lightTheme = {
  colors: tokens.light.colors,
  typography: tokens.light.typography,
  spacing: tokens.light.spacing,
};
```

**Build Tool Integration:**

```javascript
// Custom CSS-in-JS theme generation
import tokens from "./tokens.json";

const theme = {
  colors: Object.fromEntries(
    Object.entries(tokens.light.colors).map(([k, v]) => [
      k.replace("color-", ""),
      v,
    ]),
  ),
};
```

#### Stability Testing

Token changes are protected by Jest snapshot tests:

```bash
npm test -- tokensStability.test.js
```

This ensures accidental token drift is caught in CI/CD and requires explicit updates.

### Geplante Erweiterungen

- Erhöhung der Coverage Thresholds (iterativ)
- (Erledigt) Entfernen alter Sass Variablen / `main.scss`
- (Erledigt) Tailwind Theme Mapping der Tokens (für Variants)
- (Neu) Fehler-Telemetrie Stub (`registerErrorTelemetry`) für zukünftige Remote Collection
- (Erledigt) Export der Tokens als JSON für Figma / Storybook
- Optionale visuelle Regression Tests (Playwright + percy)
