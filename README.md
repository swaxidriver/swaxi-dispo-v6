# Swaxi Disponenten System v6

Ein modernes Schichtplanungssystem für Swaxi-Fahrer mit **Hybrid SharePoint/localStorage** Unterstützung für Stadtwerke Augsburg.

🌐 **Live Demo:** [https://swaxidriver.github.io/swaxi-dispo-v6/](https://swaxidriver.github.io/swaxi-dispo-v6/)

## ✨ Features

### 🔄 **Hybrid Data Layer (Feature‑Flag)**

- **SharePoint Integration (derzeit deaktiviert)** – Architektur vorhanden, Flag standardmäßig aus (`VITE_ENABLE_SHAREPOINT=false`)
- **IndexedDB / In-Memory** als aktive Persistenz
- **Umschaltbar** via `.env` (`VITE_ENABLE_SHAREPOINT=true` + optional `VITE_SHIFT_BACKEND=sharepoint`)
- **Connection Status** UI vorbereitet für Re-Aktivierung

### 🚗 **Schichtplanung**

- Umfassende Schichtplanung und -verwaltung
- 👥 Rollenbasierte Zugriffskontrolle (Admin, Chief, Disponent, Analyst)
- 📊 Echtzeit-Analytics und Statistiken
- 📅 Erweiterte Kalenderansicht mit Filtern

### 🎨 **User Experience**

- 🌓 Light/Dark Mode mit Persistence
- 📱 Vollständig responsive Design
- 🔔 Echtzeit-Benachrichtigungssystem
- � Umfassende Audit-Protokollierung

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

### **Data Layer**

- **IndexedDB / In-Memory** – Aktive Modi für lokale Demo & Tests
- **SharePoint (flag-gesteuert)** – Reaktivierbar ohne Refactor
- **Hybrid Service Layer** – Repository Pattern kapselt Backend-Wahl

### **State Management**

- **React Context API** - Zentrale State-Verwaltung
- **Custom Hooks** - Wiederverwendbare Logik
- **Real-time Updates** - Live data synchronization

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

| Code | Beschreibung |
|------|--------------|
| `TIME_OVERLAP` | Zeitliche Überlappung mit mind. einer anderen Schicht |
| `DOUBLE_APPLICATION` | Ein Benutzer hat sich auf überlappende Schichten beworben |
| `ASSIGNMENT_COLLISION` | Überlappende Schichten derselben Person zugewiesen |
| `LOCATION_MISMATCH` | Überlappende zugewiesene Schichten gleicher Person aber widersprüchlicher Arbeitsort |

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

### **🧪 Testing**

Layered Strategy (v2):

| Layer | Pfad | Zweck | Tools |
|-------|------|-------|-------|
| Unit | `src/tests/unit` | Pure Funktionen, Reducer, kleine Komponenten | Jest + RTL |
| Integration | `src/tests/integration` | Kontext + Services + Persistence Zusammenspiel | Jest + RTL + fake-indexeddb |
| Accessibility | `src/tests/a11y` | Semantik, Kontraste, Fokus-Fluss | jest-axe + Custom Matcher |

Custom Matcher: `expect(container).toHaveNoA11yViolations()` (siehe `jest.setup.js`).

Skripte:

```bash
npm run test:unit
npm run test:integration
npm run test:a11y
npm run test:coverage
```

Coverage Gates (aktuell – werden weiter angezogen):

- Global ≥63/58/63/63 (Statements/Branches/Functions/Lines)
- Utils ≥80/80/90/80
- shiftGenerationService ≥80/70/80/80

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
import ErrorBoundary from './components/ErrorBoundary'

function Root() {
   return (
      <ErrorBoundary>
         <AppRoutes />
      </ErrorBoundary>
   )
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

### Vorteile

- Einheitliche Farblogik (Surface vs. Background vs. Border)
- Leichtes Corporate-Branding Update (nur Tokens tauschen)
- Tests & Snapshots stabiler (keine zufälligen Inline-Farben)

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

Diese Klassen verweisen auf CSS-Variablen und funktionieren automatisch mit Light/Dark Mode.

### Migration Alt → Neu

Legacy Klassen `bg-brand-primary`, `text-brand-primary`, `focus:ring-brand-primary`, `bg-brand-secondary` wurden weitestgehend ersetzt durch Token-Verwendung (Stand v0.3.x). Ehemalige Sass Datei `styles/main.scss` wurde in v0.3.x entfernt – alle Werte sind nun als CSS Tokens oder Utility-Klassen verfügbar.

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

1. Neue Farben erst in `tokens.css` definieren
2. Keine Hex-Werte direkt in JSX
3. Semantische Benennung: `--color-ok`, `--color-warn`, statt spezifischer Farbnamen
4. Unterschied `--color-bg` (Seitenhintergrund) vs. `--color-surface` (Cards, Panels) beachten

### Geplante Erweiterungen

- Erhöhung der Coverage Thresholds (iterativ)
- (Erledigt) Entfernen alter Sass Variablen / `main.scss`
- (Erledigt) Tailwind Theme Mapping der Tokens (für Variants)
- (Neu) Fehler-Telemetrie Stub (`registerErrorTelemetry`) für zukünftige Remote Collection
- Export der Tokens als JSON für Figma / Storybook
- Optionale visuelle Regression Tests (Playwright + percy)
