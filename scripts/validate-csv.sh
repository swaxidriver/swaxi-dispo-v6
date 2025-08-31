#!/bin/bash

# CSV Validation Script for GitHub Issues Import
# Usage: ./scripts/validate-csv.sh <csv-file>

set -e

CSV_FILE="${1:-docs/templates/issue-import-template.csv}"

if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Error: CSV file '$CSV_FILE' not found"
    echo "Usage: $0 <csv-file>"
    exit 1
fi

echo "🔍 Validating CSV file: $CSV_FILE"
echo ""

# Required columns
REQUIRED_COLUMNS=("title" "priority" "type" "area" "epic" "milestone" "context" "outcome" "scope_ui" "scope_state" "acceptance_criteria" "test_cases")

# Valid values
VALID_PRIORITIES=("P0" "P1" "P2")
VALID_TYPES=("feature" "bug" "docs" "chore")
VALID_AREAS=("UI" "state" "perf" "docs" "tooling" "logic")

# Check if file is not empty
if [ ! -s "$CSV_FILE" ]; then
    echo "❌ Error: CSV file is empty"
    exit 1
fi

# Read header line
header=$(head -n 1 "$CSV_FILE")
IFS=',' read -ra HEADER_COLS <<< "$header"

echo "📋 Header columns found: ${#HEADER_COLS[@]}"

# Check required columns
missing_columns=()
for required in "${REQUIRED_COLUMNS[@]}"; do
    found=false
    for col in "${HEADER_COLS[@]}"; do
        if [ "$col" = "$required" ]; then
            found=true
            break
        fi
    done
    if [ "$found" = false ]; then
        missing_columns+=("$required")
    fi
done

if [ ${#missing_columns[@]} -gt 0 ]; then
    echo "❌ Missing required columns: ${missing_columns[*]}"
    exit 1
else
    echo "✅ All required columns present"
fi

# Count total lines (excluding header)
total_lines=$(($(wc -l < "$CSV_FILE") - 1))
echo "📊 Total data rows: $total_lines"

if [ $total_lines -eq 0 ]; then
    echo "⚠️  Warning: No data rows found (only header)"
    exit 0
fi

echo ""
echo "🔍 Validating data rows..."

# Validate each data row
line_number=2
errors=0
warnings=0

while IFS=, read -r title priority type area epic milestone context outcome scope_ui scope_state acceptance test_cases notes labels || [ -n "$title" ]; do
    # Skip header line
    if [ $line_number -eq 2 ]; then
        line_number=$((line_number + 1))
        continue
    fi
    
    # Skip empty lines
    if [ -z "$title" ]; then
        line_number=$((line_number + 1))
        continue
    fi
    
    row_errors=0
    
    # Clean quoted fields for validation
    title_clean=$(echo "$title" | sed 's/^"//; s/"$//')
    priority_clean=$(echo "$priority" | sed 's/^"//; s/"$//')
    type_clean=$(echo "$type" | sed 's/^"//; s/"$//')
    area_clean=$(echo "$area" | sed 's/^"//; s/"$//')
    
    # Validate title
    if [ -z "$title_clean" ]; then
        echo "❌ Line $line_number: Empty title"
        row_errors=$((row_errors + 1))
    fi
    
    # Validate priority
    if [[ ! " ${VALID_PRIORITIES[@]} " =~ " ${priority_clean} " ]]; then
        echo "❌ Line $line_number: Invalid priority '$priority_clean' (valid: ${VALID_PRIORITIES[*]})"
        row_errors=$((row_errors + 1))
    fi
    
    # Validate type
    if [[ ! " ${VALID_TYPES[@]} " =~ " ${type_clean} " ]]; then
        echo "❌ Line $line_number: Invalid type '$type_clean' (valid: ${VALID_TYPES[*]})"
        row_errors=$((row_errors + 1))
    fi
    
    # Validate area
    if [[ ! " ${VALID_AREAS[@]} " =~ " ${area_clean} " ]]; then
        echo "⚠️  Line $line_number: Uncommon area '$area_clean' (common: ${VALID_AREAS[*]})"
        warnings=$((warnings + 1))
    fi
    
    # Check for required fields
    context_clean=$(echo "$context" | sed 's/^"//; s/"$//')
    outcome_clean=$(echo "$outcome" | sed 's/^"//; s/"$//')
    
    if [ -z "$context_clean" ]; then
        echo "❌ Line $line_number: Empty context"
        row_errors=$((row_errors + 1))
    fi
    
    if [ -z "$outcome_clean" ]; then
        echo "❌ Line $line_number: Empty outcome"
        row_errors=$((row_errors + 1))
    fi
    
    errors=$((errors + row_errors))
    line_number=$((line_number + 1))
    
done < "$CSV_FILE"

echo ""
echo "📈 Validation Summary"
echo "===================="
echo "Total rows validated: $((line_number - 3))"
echo "Errors: $errors"
echo "Warnings: $warnings"

if [ $errors -eq 0 ]; then
    echo ""
    echo "✅ CSV file is valid and ready for import!"
    echo "💡 To import: ./scripts/import-issues.sh $CSV_FILE"
else
    echo ""
    echo "❌ CSV file has $errors error(s) that must be fixed before import"
    exit 1
fi

if [ $warnings -gt 0 ]; then
    echo ""
    echo "⚠️  $warnings warning(s) found - review recommended but not required"
fi