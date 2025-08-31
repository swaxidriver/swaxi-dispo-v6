# CSV Import Guide for GitHub Issues

This guide explains how to import CSV files to create GitHub issues for the Swaxi Dispo v6 project.

## Overview

The CSV import process allows you to bulk create GitHub issues from structured data, following the project's issue templates and labeling conventions.

## CSV Format

### Required Columns

The CSV file should contain the following columns:

| Column | Description | Example | Required |
|--------|-------------|---------|----------|
| `title` | Issue title following project naming convention | `[P1] Feature: Live Update Banner` | ✅ |
| `priority` | Priority level (P0, P1, P2) | `P1` | ✅ |
| `type` | Issue type (feature, bug, docs, chore) | `feature` | ✅ |
| `area` | Project area (UI, state, perf, docs, etc.) | `UI` | ✅ |
| `epic` | Epic identifier (E0, E1, E2, etc.) | `E1` | ✅ |
| `milestone` | Target milestone | `v6.3.0` | ✅ |
| `context` | Problem description | `Users can't see version changes` | ✅ |
| `outcome` | Expected user-visible outcome | `Banner shows when new version detected` | ✅ |
| `scope_ui` | UI scope description | `Sticky banner with reload button` | ✅ |
| `scope_state` | State scope description | `Version comparison logic` | ✅ |
| `acceptance_criteria` | Acceptance criteria (semicolon-separated) | `Poll version periodically;Show banner on change` | ✅ |
| `test_cases` | Test cases (semicolon-separated) | `Version change shows banner;Click reload refreshes` | ✅ |
| `notes` | Notes for implementation | `Touch files: index.html, styles block` | ❌ |
| `labels` | Additional labels (comma-separated) | `i18n,accessibility` | ❌ |

### Example CSV Content

```csv
title,priority,type,area,epic,milestone,context,outcome,scope_ui,scope_state,acceptance_criteria,test_cases,notes,labels
"[P1] Feature: Live Update Banner",P1,feature,UI,E1,v6.3.0,"Users don't know when app version changes","Banner appears when new version detected","Sticky banner with reload button","Version comparison logic","Poll version periodically;Show banner on change;Manual reload only","Version change shows banner;Click reload refreshes","Touch files: index.html, styles block",
"[P0] Bug: ID Generation Duplicate",P0,bug,state,E0,v6.3.0,"Duplicate IDs causing state corruption","Unique IDs for all generated entities","Error handling UI","ID generation uniqueness","Generate unique IDs;No duplicates;Handle race conditions","Multiple clicks generate unique IDs;No state corruption","Fix uid() function, add deduplication",critical
```

## Import Process

### Step 1: Prepare CSV File

1. **Export from planning tools** or create manually following the format above
2. **Validate data** - ensure all required columns are present
3. **Check naming conventions** - follow project standards for titles and labels
4. **Save as UTF-8 CSV** - to handle special characters properly

### Step 2: Convert to GitHub Issues

Currently, the conversion process is manual but follows this workflow:

1. **Open CSV file** in spreadsheet application
2. **For each row**, create a GitHub issue with:
   - **Title**: Use the `title` column directly
   - **Labels**: Combine `type:`, `prio:`, `area:` prefixes with values + any additional labels
   - **Milestone**: Set to the `milestone` value
   - **Body**: Format using the issue template (see below)

### Step 3: Issue Body Template

Use this template for the issue body, filling in values from CSV columns:

```markdown
**Epic:** {epic} - {epic_description}

### Context
- **Problem:** {context}
- **Outcome (user visible):** {outcome}
- **Non-goals:** [From context or manual input]

### Scope
- **UI:** {scope_ui}
- **State:** {scope_state}
- **Edge cases:** [Manual input if needed]

### Acceptance Criteria
{acceptance_criteria split by semicolon into bullet points}

### Test Plan
{test_cases split by semicolon into test cases}

### Notes for Copilot
{notes}
```

## Automation Options

### Automated Import Script

The project includes a ready-to-use automation script:

```bash
# Make script executable (first time only)
chmod +x scripts/import-issues.sh

# Test run (dry run mode)
./scripts/import-issues.sh docs/templates/issue-import-template.csv true

# Import issues from CSV
./scripts/import-issues.sh my-issues.csv

# Import with custom CSV file
./scripts/import-issues.sh path/to/my-issues.csv
```

**Script Features:**
- ✅ **Dry run mode** - Preview what will be created without making changes
- ✅ **Error handling** - Validates CSV format and GitHub authentication
- ✅ **Rate limiting** - Prevents API rate limit issues
- ✅ **Progress feedback** - Shows status for each issue creation
- ✅ **Flexible input** - Works with any properly formatted CSV file

### GitHub CLI Method

For bulk creation, you can use GitHub CLI:

```bash
# Install GitHub CLI
gh auth login

# Create issues from CSV (example script)
while IFS=, read -r title priority type area epic milestone context outcome scope_ui scope_state acceptance test_cases notes labels
do
    gh issue create \
        --title "$title" \
        --label "type:$type,prio:$priority,area:$area" \
        --milestone "$milestone" \
        --body "$(cat <<EOF
**Epic:** $epic

### Context
- **Problem:** $context
- **Outcome (user visible):** $outcome

### Scope
- **UI:** $scope_ui
- **State:** $scope_state

### Acceptance Criteria
$(echo "$acceptance" | sed 's/;/\n- /g' | sed 's/^/- /')

### Test Plan
$(echo "$test_cases" | sed 's/;/\n- **Case /g' | sed 's/^/- **Case /' | sed 's/$:** /')

### Notes for Copilot
$notes
EOF
)"
done < issues.csv
```

### API Integration

For more sophisticated automation, consider using GitHub's REST API or GraphQL API to:

1. **Validate milestones** exist before creating issues
2. **Auto-assign** based on area or epic
3. **Link related issues** within the same epic
4. **Update project boards** automatically

## File Examples

### Sample CSV Template

A template CSV file is available at: `docs/templates/issue-import-template.csv`

### Real Import File

The actual issues for this project were imported from: `swaxi-dispo-v6-issues.csv`

## Validation

Before importing, validate your CSV:

1. **Column count**: Ensure all rows have the same number of columns
2. **Required fields**: Check no required columns are empty
3. **Priority values**: Must be P0, P1, or P2
4. **Type values**: Must be feature, bug, docs, or chore
5. **Milestone format**: Should match existing project milestones

## Integration with Project Planning

This CSV import process integrates with:

- **Epic planning** in `docs/swaxi_issue_plan.md`
- **Issue templates** in `docs/github-issues.md`
- **Milestone structure** in `docs/github-milestones.md`
- **Project labels** defined in repository settings

## Troubleshooting

### Common Issues

1. **Encoding problems**: Save CSV as UTF-8
2. **Comma in content**: Use quotes around fields containing commas
3. **Line breaks**: Use `\n` or ensure proper CSV escaping
4. **Large files**: Split into smaller batches for manual processing

### Validation Errors

- **Missing milestones**: Create milestones first in GitHub
- **Invalid labels**: Check project label configuration
- **Duplicate titles**: GitHub allows duplicates, but consider adding suffixes

## Future Enhancements

Planned improvements to the CSV import process:

1. **Automated import script** - GitHub Action or local tool
2. **Template validation** - Check CSV format before import
3. **Epic linking** - Automatically link issues within epics
4. **Project board integration** - Add to appropriate project columns
5. **Bulk updates** - Support for updating existing issues

---

For questions or improvements to this process, please create an issue with the `docs` label.