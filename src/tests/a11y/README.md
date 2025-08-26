# Accessibility (a11y) Tests

Focused on static analysis with jest-axe and interaction focus order.

## Guidelines

- Use `axe(container)` and custom matcher wrapper.
- Test keyboard-only navigation for modals/menus.
- Avoid snapshot reliance; assert roles/names.
