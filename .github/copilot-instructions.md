# Swaxi Disponenten System v6 - Copilot Instructions

**ALWAYS follow these instructions first. Only fallback to additional search and context gathering if the information in these instructions is incomplete or found to be in error.**

## Working Effectively

### Bootstrap, Build, and Test the Repository

**CRITICAL: NEVER CANCEL builds or long-running commands. Builds and tests may take 10+ minutes. Always set timeouts of 60+ minutes for build commands and 30+ minutes for test commands.**

```bash
# 1. Install dependencies (takes ~50 seconds)
npm install

# 2. REQUIRED: Install Rollup native binary (build will fail without this)
npm install --no-save @rollup/rollup-linux-x64-gnu

# 3. Build application (takes ~7 seconds) - NEVER CANCEL, set timeout to 10+ minutes
npm run build

# 4. Run comprehensive test suite (takes ~10 seconds) - NEVER CANCEL, set timeout to 30+ minutes
npm test

# 5. Run test coverage (takes ~13 seconds) - NEVER CANCEL, set timeout to 30+ minutes
npm run test:coverage

# 6. Run quality gate (includes tests + linting, takes ~12 seconds) - NEVER CANCEL, set timeout to 30+ minutes
npm run quality
```

### Development Commands

```bash
# Start development server (ready in ~230ms)
npm run dev
# → Serves on http://localhost:5173/swaxi-dispo-v6/

# Build for production (takes ~7 seconds) - NEVER CANCEL, set timeout to 10+ minutes
npm run build

# Preview production build locally
npm run preview
# → Serves on http://localhost:4173/swaxi-dispo-v6/

# Linting (takes ~1 second)
npm run lint

# Import integrity check
npm run check:imports

# Token linting (checks for hardcoded colors)
npm run lint:tokens
```

### Test Commands

```bash
# Run all tests - NEVER CANCEL, set timeout to 30+ minutes
npm test

# Run tests in watch mode - NEVER CANCEL
npm run test:watch

# Run with coverage - NEVER CANCEL, set timeout to 30+ minutes
npm run test:coverage

# Run specific test layers
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:a11y       # Accessibility tests only
```

## Validation Scenarios

**ALWAYS manually validate any changes by running complete end-to-end scenarios after making changes.**

### Core Validation Workflow

1. **Start development server:**

   ```bash
   npm run dev
   ```

2. **Test main dashboard:** Navigate to http://localhost:5173/swaxi-dispo-v6/
   - Verify connection status shows "🟡 Offline-Modus (localStorage)"
   - Check dashboard analytics show shift counts (e.g., "21 Offene Dienste")
   - Confirm autosave indicator shows "Autosave: gerade eben"

3. **Test calendar functionality:** Navigate to http://localhost:5173/swaxi-dispo-v6/calendar
   - Verify weekly calendar grid loads with time slots (00:00-23:00)
   - Test week navigation buttons (Vorherige Woche, Heute, Nächste Woche)
   - If snapshot restoration modal appears, restore a snapshot with data
   - Verify conflict legend displays at bottom

4. **Test comprehensive test suite:** Navigate to http://localhost:5173/swaxi-dispo-v6/test
   - Run all automated tests via the test interface
   - Verify connection status and diagnostics work
   - Export test results if available

5. **Test responsiveness:** Resize browser window to verify mobile/tablet layouts

### Build Validation

Always test production builds:

```bash
# Build and validate
npm run build
npm run preview
# Test the same scenarios on http://localhost:4173/swaxi-dispo-v6/
```

## Timing Expectations & Timeouts

**CRITICAL: Always use these timeout values. NEVER CANCEL running commands.**

| Command                 | Expected Time | Recommended Timeout |
| ----------------------- | ------------- | ------------------- |
| `npm install`           | ~50 seconds   | 10 minutes          |
| `npm run build`         | ~7 seconds    | 10 minutes          |
| `npm test`              | ~10 seconds   | 30 minutes          |
| `npm run test:coverage` | ~13 seconds   | 30 minutes          |
| `npm run quality`       | ~12 seconds   | 30 minutes          |
| `npm run dev` (startup) | ~230ms        | 2 minutes           |
| `npm run lint`          | ~1 second     | 5 minutes           |

**WARNING: The build process includes PostCSS warnings about @import order and eval usage warnings. These are expected and do not indicate failures.**

## Key Project Information

### Technology Stack

- **React 19** - Modern UI library with latest features
- **Vite 7** - Ultra-fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework with custom design tokens
- **Jest** - Testing framework with 138/139 tests passing
- **TypeScript/JavaScript** - Mixed codebase with modern ES modules

### Data Architecture

- **Hybrid Mode:** SharePoint + localStorage fallback
- **Feature Flags:** `VITE_ENABLE_SHAREPOINT=false` (currently disabled)
- **Persistence:** IndexedDB + localStorage for offline functionality
- **Autosave:** Automatic snapshot system with restoration capabilities

### Project Structure

```
src/
├── components/          # UI components (Navigation, ConnectionStatus, etc.)
├── contexts/           # React Context (ShiftContext, AuthContext, ThemeContext)
├── pages/             # Main pages (Dashboard, Calendar, TestPage)
├── services/          # Business logic (sharePointService, migrationService)
├── utils/             # Helper functions (auth, conflicts, validation)
├── tests/             # Comprehensive test suite
│   ├── unit/          # Pure function tests
│   ├── integration/   # Cross-layer behavior tests
│   └── a11y/          # Accessibility tests
└── styles/            # Design tokens and CSS
```

### Important Files

- `src/contexts/ShiftContext.jsx` - Core data management
- `src/components/ConnectionStatus.jsx` - SharePoint/localStorage status
- `src/pages/TestPage.jsx` - Comprehensive test interface
- `src/styles/tokens.css` - Design system tokens
- `jest.setup.js` & `jest.setup.cjs` - Test configuration
- `vite.config.js` - Build configuration

## Common Issues & Solutions

### Build Failures

- **"Cannot find module @rollup/rollup-linux-x64-gnu"**: Run `npm install --no-save @rollup/rollup-linux-x64-gnu`
- **PostCSS @import warnings**: Expected behavior, safe to ignore
- **eval usage warnings**: Expected in featureFlags.js, safe to ignore

### Test Failures

- **TextEncoder issues**: Related to router tests, generally pass on retry
- **Act() warnings**: Suppressed for async Headless UI transitions
- **1 skipped test**: Expected due to environment limitations

### Development Issues

- **Blank pages on first load**: App needs 2-3 seconds to initialize data
- **Calendar showing loading**: Wait for autosave restoration modal, restore snapshot
- **Missing shifts**: Use snapshot restoration or visit test page to generate data

## Validation Requirements

### Pre-Commit Checklist

Always run before committing changes:

```bash
# 1. Lint code - NEVER CANCEL, set timeout to 5+ minutes
npm run lint

# 2. Run quality gate - NEVER CANCEL, set timeout to 30+ minutes
npm run quality

# 3. Check import integrity
npm run check:imports

# 4. Validate build works - NEVER CANCEL, set timeout to 10+ minutes
npm run build
```

### Manual Testing Checklist

- [ ] Dashboard loads and shows connection status
- [ ] Calendar displays weekly grid correctly
- [ ] Test page provides comprehensive diagnostics
- [ ] Navigation between pages works smoothly
- [ ] Autosave/restore functionality operates
- [ ] Theme toggle works (light/dark mode)
- [ ] Responsive design functions on mobile sizes

## URLs & Access Points

- **Local Development:** http://localhost:5173/swaxi-dispo-v6/
- **Production Preview:** http://localhost:4173/swaxi-dispo-v6/ (after `npm run preview`)
- **Test Suite:** http://localhost:5173/swaxi-dispo-v6/test
- **Live Demo:** https://swaxidriver.github.io/swaxi-dispo-v6/
- **Live Test Suite:** https://swaxidriver.github.io/swaxi-dispo-v6/test

## Architecture Notes

### Hybrid Data Layer

The app automatically detects SharePoint availability and falls back to localStorage. Feature flags control backend selection:

- `VITE_ENABLE_SHAREPOINT=false` - Currently disabled, uses localStorage
- Connection status indicator shows current mode (🟡 localStorage, 🟢 SharePoint)

### State Management

- React Context API for global state
- ShiftContext manages all shift data and persistence
- ThemeContext handles light/dark mode persistence
- AuthContext manages user authentication and roles

### Testing Strategy

Layered approach with three test types:

- **Unit:** Pure functions, reducers, small components
- **Integration:** Cross-layer behavior, contexts + services + persistence
- **Accessibility:** WCAG compliance, focus management, contrast

Coverage thresholds enforced:

- Global: ≥63% statements, ≥58% branches, ≥63% functions, ≥63% lines
- Utils: ≥80% statements, ≥80% branches, ≥90% functions, ≥80% lines

### Design System

Uses design tokens in `src/styles/tokens.css` for consistent theming:

- Semantic color variables (`--color-primary`, `--color-surface`)
- Typography scales with self-hosted Manrope font
- Dark/light mode via `data-theme` attribute
- Utility classes for common patterns

## Critical Reminders

1. **NEVER CANCEL** any build, test, or quality command - they may run for 10+ minutes
2. **ALWAYS** set timeouts of 60+ minutes for builds and 30+ minutes for tests
3. **ALWAYS** manually test core user scenarios after making changes
4. **ALWAYS** run the full validation checklist before committing
5. **ALWAYS** install the Rollup native binary after `npm install`
6. **ALWAYS** wait for app initialization (2-3 seconds) when testing manually
