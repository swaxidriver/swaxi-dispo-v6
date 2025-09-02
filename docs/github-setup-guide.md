# GitHub Setup Quick Reference

This file provides quick instructions for setting up the GitHub repository with the milestones, labels, and issues defined in the swaxi_issue_plan.md.

## Step 1: Create Labels

Go to repository Settings > Labels and create these labels:

### Type Labels

- `type:feature` (color: #0366d6) - New functionality
- `type:bug` (color: #d73a49) - Bug fixes
- `type:chore` (color: #6f42c1) - Maintenance tasks
- `type:doc` (color: #0366d6) - Documentation updates

### Priority Labels

- `prio:P0` (color: #d73a49) - Critical for stability
- `prio:P1` (color: #fbca04) - Important features
- `prio:P2` (color: #0366d6) - Nice to have

### Area Labels

- `area:UI` (color: #bfdadc) - User interface changes
- `area:logic` (color: #bfdadc) - Business logic
- `area:perf` (color: #bfdadc) - Performance improvements
- `area:state` (color: #bfdadc) - State management

### Role Labels

- `role:admin` (color: #f9d0c4) - Admin functionality
- `role:chief` (color: #f9d0c4) - Chief user features
- `role:disponent` (color: #f9d0c4) - Disponent features
- `role:analyst` (color: #f9d0c4) - Analytics features

### Special Labels

- `a11y` (color: #c2e0c6) - Accessibility improvements
- `i18n` (color: #c2e0c6) - Internationalization
- `good first issue` (color: #7057ff) - Good for new contributors

## Step 2: Create Milestones

Go to Issues > Milestones > New milestone:

1. **v6.3.0 (M0+M1)** - Stability & UX Baseline
2. **v6.4.0 (M2+M3)** - Analytics & Calendar
3. **v6.5.0 (M4+M5+M6)** - Advanced Features
4. **v6.6.0 (M7+M8+M9+M10)** - Polish & Performance

See `docs/github-milestones.md` for detailed descriptions.

## Step 3: Create Issues

Copy each issue from `docs/github-issues.md` into GitHub Issues:

1. Click "New issue"
2. Choose appropriate template (Feature Request, Bug Report, or Chore)
3. Copy title and description from the docs file
4. Add appropriate labels
5. Assign to milestone
6. Create issue

**Tip:** Create issues in priority order (P0 first, then P1, then P2)

## Step 4: Verify Setup

After creating all issues and milestones:

- [ ] 4 milestones created
- [ ] 15+ labels created with correct colors
- [ ] 15 issues created with proper labels and milestones
- [ ] Issue templates work correctly
- [ ] PR template appears when creating PRs

## Files Created in This Setup

- `.github/ISSUE_TEMPLATE/feature_request.md` - Feature request template
- `.github/ISSUE_TEMPLATE/bug_report.md` - Bug report template
- `.github/ISSUE_TEMPLATE/chore.md` - Chore/documentation template
- `.github/pull_request_template.md` - Pull request template
- `docs/github-milestones.md` - Milestone definitions
- `docs/github-issues.md` - Ready-to-copy issue descriptions
- `docs/github-setup-guide.md` - This setup guide

## Workflow After Setup

1. **Development:** Create branches per issue: `feature/<id>-<slug>` or `fix/<id>-<slug>`
2. **PRs:** Open PRs to `develop` branch with screenshots
3. **Testing:** Follow manual smoke test in `docs/swaxi_issue_plan.md` Appendix B
4. **Release:** Merge `develop` → `main`, tag version, create GitHub release

See `docs/swaxi_issue_plan.md` section 5 for complete workflow details.
