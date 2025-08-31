#!/bin/bash

# CSV to GitHub Issues Import Script
# Usage: ./scripts/import-issues.sh <csv-file>
# Requirements: GitHub CLI (gh) must be installed and authenticated

set -e

CSV_FILE="${1:-docs/templates/issue-import-template.csv}"
DRY_RUN="${2:-false}"

if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Error: CSV file '$CSV_FILE' not found"
    echo "Usage: $0 <csv-file> [dry-run]"
    echo "Example: $0 my-issues.csv true"
    exit 1
fi

# Check if GitHub CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Error: GitHub CLI is not authenticated"
    echo "Run: gh auth login"
    exit 1
fi

echo "🚀 Starting CSV import from: $CSV_FILE"
echo "📁 Repository: $(gh repo view --json nameWithOwner -q .nameWithOwner)"

if [ "$DRY_RUN" = "true" ]; then
    echo "🧪 DRY RUN MODE - No issues will be created"
fi

# Skip header line and process CSV
line_number=1
while IFS=, read -r title priority type area epic milestone context outcome scope_ui scope_state acceptance test_cases notes labels || [ -n "$title" ]; do
    # Skip header line
    if [ $line_number -eq 1 ]; then
        line_number=$((line_number + 1))
        continue
    fi
    
    # Skip empty lines
    if [ -z "$title" ]; then
        continue
    fi
    
    # Clean up quoted fields
    title=$(echo "$title" | sed 's/^"//; s/"$//')
    context=$(echo "$context" | sed 's/^"//; s/"$//')
    outcome=$(echo "$outcome" | sed 's/^"//; s/"$//')
    scope_ui=$(echo "$scope_ui" | sed 's/^"//; s/"$//')
    scope_state=$(echo "$scope_state" | sed 's/^"//; s/"$//')
    acceptance=$(echo "$acceptance" | sed 's/^"//; s/"$//')
    test_cases=$(echo "$test_cases" | sed 's/^"//; s/"$//')
    notes=$(echo "$notes" | sed 's/^"//; s/"$//')
    labels=$(echo "$labels" | sed 's/^"//; s/"$//')
    
    # Build labels string
    issue_labels="type:$type,prio:$priority,area:$area"
    if [ -n "$labels" ]; then
        issue_labels="$issue_labels,$labels"
    fi
    
    # Convert acceptance criteria from semicolon-separated to bullet points
    acceptance_bullets=$(echo "$acceptance" | sed 's/;/\n- /g' | sed 's/^/- /')
    
    # Convert test cases from semicolon-separated to numbered cases
    test_bullets=$(echo "$test_cases" | sed 's/;/\n- **Case /g' | sed 's/^/- **Case /' | sed 's/$/**/')
    
    # Create issue body
    issue_body="**Epic:** $epic

### Context
- **Problem:** $context
- **Outcome (user visible):** $outcome
- **Non-goals:** [Define based on context]

### Scope
- **UI:** $scope_ui
- **State:** $scope_state
- **Edge cases:** [Define based on implementation]

### Acceptance Criteria
$acceptance_bullets

### Test Plan
$test_bullets

### Notes for Copilot
$notes

---
*Created via CSV import from: $CSV_FILE*"

    echo ""
    echo "📝 Processing line $line_number: $title"
    echo "   Labels: $issue_labels"
    echo "   Milestone: $milestone"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo "   🧪 DRY RUN - Would create issue with above details"
    else
        # Create the issue
        echo "   ⏳ Creating issue..."
        if gh issue create \
            --title "$title" \
            --label "$issue_labels" \
            --milestone "$milestone" \
            --body "$issue_body" > /dev/null 2>&1; then
            echo "   ✅ Issue created successfully"
        else
            echo "   ❌ Failed to create issue"
            echo "   📋 Title: $title"
            echo "   🏷️  Labels: $issue_labels"
            echo "   🎯 Milestone: $milestone"
        fi
    fi
    
    line_number=$((line_number + 1))
    
    # Rate limiting: pause between requests
    if [ "$DRY_RUN" != "true" ]; then
        sleep 1
    fi
    
done < "$CSV_FILE"

echo ""
echo "🎉 CSV import completed!"
echo "📊 Processed $((line_number - 2)) issues from $CSV_FILE"

if [ "$DRY_RUN" = "true" ]; then
    echo "🧪 This was a dry run - no issues were actually created"
    echo "💡 To create issues, run: $0 $CSV_FILE false"
else
    echo "✅ Issues have been created in the repository"
    echo "🔗 View issues: gh issue list"
fi