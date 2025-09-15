# Development quick guide

This project is optimized for VS Code on Windows. The repo includes tasks, launch configs, and test tooling to speed up common workflows.

## VS Code tasks

Open the Command Palette and run “Tasks: Run Task”, then choose:

- Dev: Vite server — Start the app with hot reload
- Build: Production — Build the site with Vite
- Lint: ESLint — Run ESLint (flat config)
- Type check — Validate types
- Test: Jest (watch) — Unit tests in watch mode
- Test: Jest (coverage) — Unit tests with coverage
- E2E: Playwright — End‑to‑end tests
- Quality Gate — Lint + Type check + Unit tests
- Backend: Demo server — Start the example backend
- A11y: Contrast audit — Run contrast checker

## Windows PowerShell notes

If npm scripts are blocked by execution policy, allow local scripts for your user:

- Run PowerShell as current user: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
- You can revert later with: Set-ExecutionPolicy -Scope CurrentUser Restricted

## Node & package manager

- Use Node 20+ (CI tests Node 20 and 22)
- Install deps with: npm ci (CI) or npm install (local)

## Testing

- Unit tests: Jest 30 with Testing Library; config: jest.config.js; setup: jest.setup.js
- E2E: Playwright; configs in the repo; use VS Code Test Explorer or tasks above

## AI coding helpers

- Codex CLI is supported. Quick help task available in VS Code (Tasks → Codex: help)
- You can also run codex --help in an integrated terminal

## Troubleshooting

- Lint errors: Run Lint: ESLint task; auto-fix with npm run lint:fix
- Ports in use: Vite defaults to 5173; the backend demo server uses 3001
- Stuck tests: Try npm run test:clear to reset Jest cache
