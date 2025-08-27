# Swaxi Disponenten System v6 - Copilot Instructions

**Always follow these instructions first and only fallback to additional search and context gathering if the information here is incomplete or found to be in error.**

## Working Effectively

### Bootstrap and Build Process
- Install dependencies: `npm install` -- takes ~45s, installs 779 packages
- **Linux Rollup Fix** (REQUIRED): `npm install --no-save @rollup/rollup-linux-x64-gnu` -- fixes build on Linux environments
- Build application: `npm run build` -- takes ~6s. NEVER CANCEL. Set timeout to 2+ minutes.
- Preview build: `npm run preview` -- serves at http://localhost:4173/swaxi-dispo-v6/

### Development Workflow  
- Start dev server: `npm run dev` -- starts in ~220ms at http://localhost:5173/swaxi-dispo-v6/
- Run all tests: `npm test` -- takes ~12s. NEVER CANCEL. Set timeout to 5+ minutes.
- Test with coverage: `npm run test:coverage` -- takes ~10s. NEVER CANCEL. Set timeout to 5+ minutes.
- Lint code: `npm run lint` -- runs ESLint, usually <5s
- Quality gate: `npm run quality` -- comprehensive quality check, ~15s

### Critical Build Notes
- **NEVER CANCEL** any build or test commands - they complete quickly but timeouts should be generous
- **PostCSS @import warnings** are non-blocking - CSS imports have ordering issues but don't affect functionality  
- **Rollup binary workaround** is mandatory on Linux: `npm install --no-save @rollup/rollup-linux-x64-gnu`

## Testing and Validation

### Test Infrastructure
- **Unit tests**: `npm run test:unit` -- tests pure functions and small components
- **Integration tests**: `npm run test:integration` -- tests component interactions with services
- **Accessibility tests**: `npm run test:a11y` -- tests semantic HTML and a11y compliance
- **Test coverage**: Good coverage ~63-68% across statements/branches/functions/lines
- **Jest setup**: Uses fake-indexeddb for IndexedDB mocking, @testing-library/react for components

### Manual Validation Scenarios
Always test these scenarios after making changes:

1. **Basic Application Flow**:
   - Start dev server: `npm run dev`
   - Navigate to http://localhost:5173/swaxi-dispo-v6/
   - Verify dashboard loads with shift statistics
   - Check connection status shows "🟡 Offline-Modus (localStorage)"

2. **Test Page Validation** (CRITICAL):
   - Navigate to http://localhost:5173/swaxi-dispo-v6/test
   - Click "🚀 Alle Tests starten" button
   - Verify test results show:
     - SharePoint Verfügbarkeit: FAIL (expected - SharePoint disabled by default)
     - Daten laden: PASS (localStorage working)
     - Schicht erstellen: PASS (shift creation working)
     - Audit Protokoll: PASS (audit logging working)

3. **Navigation Flow**:
   - Test all navigation links: Übersicht, Kalender, 🧪 Test, Anmelden
   - Verify responsive design and theme toggle functionality
   - Check accessibility with screen reader patterns

### Import Integrity and Code Quality
- Run import checks: `npm run check:imports` -- validates import/export consistency
- Format code: `npm run format` -- Prettier formatting
- Always run `npm run lint` and `npm run quality` before committing changes

## Application Architecture

### Hybrid Data Layer
- **Current Mode**: localStorage (SharePoint disabled via feature flag)
- **Feature Flag**: `VITE_ENABLE_SHAREPOINT=false` in .env (see .env.example)
- **Fallback Strategy**: Automatically falls back to localStorage when SharePoint unavailable
- **Repository Pattern**: InMemoryShiftRepository, IndexedDBShiftRepository, SharePointShiftRepository

### Key Technologies
- **Frontend**: React 19.1.1 + Vite 7.1.3 + TypeScript
- **Styling**: TailwindCSS + Headless UI components  
- **Testing**: Jest + @testing-library/react + jest-axe
- **State**: React Context pattern for shift, auth, theme management
- **Build**: Vite with optimized chunks (vendor, router, ui)

### Directory Structure
```
src/
  components/     # Reusable UI components
  contexts/       # React Context providers  
  pages/          # Route components
  repository/     # Data access layer
  services/       # Business logic services
  utils/          # Pure utility functions
  tests/          # Test suites (unit, integration, a11y)
```

## Common Tasks

### Development Commands
```bash
# Start development
npm run dev              # Dev server at :5173/swaxi-dispo-v6/

# Build and validate  
npm run build            # Production build to dist/
npm run preview          # Preview build at :4173/swaxi-dispo-v6/
npm test                 # Run all tests (~12s)
npm run lint            # ESLint validation
npm run quality         # Comprehensive quality gate

# Testing variants
npm run test:watch      # Watch mode for tests
npm run test:coverage   # With coverage report
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only  
npm run test:a11y       # Accessibility tests only
```

### Build Artifacts
```bash
ls -la dist/            # Built files
# - index.html (entry point)
# - assets/ (CSS, JS chunks)
# - manifest.webmanifest (PWA manifest)
# - sw.js (service worker)
```

## CI/CD Pipeline

### GitHub Actions
- **CI**: `.github/workflows/ci.yml` -- builds, tests, lints, deploys to GitHub Pages
- **Build time**: ~2-3 minutes total in CI environment
- **Quality gates**: Lint, test, coverage thresholds, import integrity
- **Deployment**: Auto-deploys to https://swaxidriver.github.io/swaxi-dispo-v6/

### Quality Requirements
- **Coverage thresholds**: statements≥63%, branches≥58%, functions≥63%, lines≥63%
- **Lint**: ESLint must pass with 0 errors
- **Import integrity**: All imports must reference valid exports
- **Build**: Must complete without errors

## Known Issues and Workarounds

### Linux Development
- **Rollup Binary**: Must install `@rollup/rollup-linux-x64-gnu` before build
- **Command**: `npm install --no-save @rollup/rollup-linux-x64-gnu`

### SharePoint Integration  
- **Status**: Currently disabled (feature flag off)
- **Fallback**: Uses localStorage automatically
- **Testing**: SharePoint connection tests FAIL as expected
- **Future**: Will be enabled via `VITE_ENABLE_SHAREPOINT=true`

### CSS Warnings
- **@import ordering**: PostCSS warnings about @import order are non-blocking
- **Impact**: Visual styling works correctly despite warnings

## Frequently Referenced Commands Output

### Repository Root Contents
```
├── .github/workflows/   # CI/CD pipelines
├── src/                # Source code  
├── public/             # Static assets
├── dist/               # Build output (after npm run build)
├── reports/            # Test and quality reports
├── scripts/            # Build and quality scripts
├── README.md           # Main documentation
├── package.json        # Dependencies and scripts
├── vite.config.js      # Build configuration
├── jest.config.js      # Test configuration
├── tailwind.config.js  # Styling configuration
└── .env.example        # Environment variables template
```

### Package.json Scripts
```json
{
  "dev": "vite",
  "build": "vite build", 
  "preview": "vite preview",
  "test": "jest",
  "test:coverage": "jest --coverage",
  "lint": "eslint .",
  "quality": "node scripts/quality.mjs",
  "check:imports": "node scripts/check-imports.mjs"
}
```

## Validation Checklist

Before completing any changes, always:

1. **Build validation**: `npm run build` completes successfully
2. **Test validation**: `npm test` passes (138+ tests)  
3. **Lint validation**: `npm run lint` passes with 0 errors
4. **Import validation**: `npm run check:imports` passes
5. **Quality gate**: `npm run quality` passes thresholds
6. **Manual testing**: Navigate to `/test` page and run "🚀 Alle Tests starten"
7. **Functional testing**: Verify dashboard, navigation, and core user flows

## Time Expectations

- **Dependencies install**: ~45 seconds
- **Build**: ~6 seconds  
- **Tests**: ~12 seconds
- **Lint**: ~3 seconds
- **Dev server startup**: ~220ms
- **Quality gate**: ~15 seconds

**NEVER CANCEL builds or tests** - they complete quickly. Use generous timeouts (5+ minutes) to account for slower CI environments.