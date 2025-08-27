# Contrast & Dark Mode Audit Plan

This document supports Issue: "Dark mode toggle unreliable, poor contrast, font modernization".

## Scope

- Verify theme toggle reliability (localStorage persistence, initial flash, system preference respect).
- Audit WCAG 2.1 AA contrast for primary semantic pairs.
- Adjust token palette minimally to pass AA (normal text 4.5:1, large 3:1, UI components focus states).

## Pairs To Test

| Token Role | Light | Dark | Against |
|------------|-------|------|---------|
| text vs bg | `--color-text` #0f172a vs `--color-bg` #f8fafc | #f1f5f9 vs #0f172a | backgrounds |
| muted vs bg | #64748b vs #f8fafc | #94a3b8 vs #0f172a | backgrounds |
| primary vs bg | #222F88 vs #f8fafc | #3b4da3 vs #0f172a | backgrounds |
| primary vs surface | #222F88 vs #ffffff | #3b4da3 vs #1e293b | surfaces |
| surface text vs surface | #0f172a vs #ffffff | #f1f5f9 vs #1e293b | cards |

## Tooling

Add a small node script (`scripts/contrast-audit.mjs`) computing contrast ratios using the WCAG formula; fail (non-zero exit) if a core pair < threshold.

## Adjustments (Proposed)

| Role | Change | Rationale |
|------|--------|-----------|
| `--color-primary` (dark) | lighten slightly if contrast insufficient | Ensure >= 4.5:1 on dark bg |
| `--color-muted` (dark) | reduce lightness a bit | Avoid <4.5:1 vs bg |

## Tasks

1. Harden initial theme application to avoid flash of wrong theme.
2. Implement script & add `npm run audit:contrast`.
3. Adjust tokens and document in CHANGELOG.
4. Add Jest a11y test ensuring `[data-theme="dark"]` root has expected tokens set.

---
Generated support doc; see Issue for live tracking.
