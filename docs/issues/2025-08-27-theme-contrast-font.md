# Issue: Dark Mode Toggle Unreliable, Poor Contrast, Font Modernization Follow-up

Date: 2025-08-27

## Problem

- User reports dark mode ("night view") toggle not working on deployed site (possible flash of light theme or persistence failure).
- Contrast in dark mode insufficient for primary brand color vs background (confirmed <4.5:1 before fix).
- Legacy external font loading produced inconsistent typography (fallback Inter showing sometimes).
- IDE showed "994 problems" (investigation: actual lint warnings minimal; likely coverage threshold & diagnostics noise).

## Actions Taken

- Self-hosted Manrope via `@fontsource/manrope`; removed Google Fonts link.
- Added early inline script to apply persisted/system theme to prevent FOUC.
- Introduced contrast audit script (`npm run audit:contrast`).
- Adjusted dark theme primary tokens: `--color-primary: #8094ff`, `--color-primary-emphasis: #5d72d6` (first pass) then `#4f67d2` (second pass) to meet button text contrast.

## Remaining Tasks

1. Add automated a11y test to assert dark token values applied when `data-theme=dark`.
2. Evaluate additional component-specific contrast (buttons, focus rings) under dark mode.
3. Consider removing unused legacy `main.scss` if fully superseded by tokens + Tailwind utilities.
4. Review coverage thresholds vs current suite and plan incremental improvements.

## Verification

Re-run after second emphasis adjustment (`#4f67d2`): all contrast pairs PASS (button text ratio ≈5.00).

---

Tracking document; consider converting to GitHub issue if external tracker preferred.
