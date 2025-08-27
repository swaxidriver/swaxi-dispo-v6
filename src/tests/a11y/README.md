# Accessibility (a11y) Tests

Static analysis (jest-axe) + critical keyboard interaction flows.

## Guidelines

- Use `await expect(container).toHaveNoA11yViolations()` (custom matcher in `jest.setup.js`).
- Validate focus trap / order: Tab / Shift+Tab through interactive controls.
- Assert semantic roles, names, aria-attributes – not styling.
- Keep axe runs minimal (one per rendered variant) to keep suite fast.
