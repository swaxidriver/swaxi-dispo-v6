# Bulk Operations Documentation

This document describes the new bulk operations functionality implemented for multi-assign, swap, and copy week operations.

## Overview

The bulk operations module (`src/ui/bulk-operations.js`) provides four main functions for managing shifts in bulk:

1. **Copy Week to Next Week** - Duplicates shifts with automatic date shifting
2. **Swap Assignments** - Exchanges assignments between Disponenten with audit trail
3. **Multi-Assign Shifts** - Assigns multiple shifts to a single Disponent
4. **Multi-Unassign Shifts** - Removes assignments from multiple shifts

Additionally, it provides enhanced multi-select functionality with shift+click range selection.

## Functions

### `copyWeekToNext(shifts, repository, userContext)`

Copies shifts from one week to the next week with automatic date shifting.

**Parameters:**

- `shifts` - Array of shift objects to copy
- `repository` - Repository instance for persistence
- `userContext` - User context for audit (optional)

**Returns:** Promise<Array> - Array of newly created shifts

**Features:**

- Automatically shifts dates by +7 days
- Resets assignments (status becomes 'open', assignedTo becomes null)
- Groups shifts by week to ensure complete week copying
- Creates detailed audit trail

```javascript
const copiedShifts = await copyWeekToNext(selectedShifts, repository, {
  actor: "john.doe@example.com",
  role: "MANAGER",
});
```

### `swapAssignments(assignment1Id, assignment2Id, repository, userContext)`

Swaps assignments between two Disponenten with detailed audit trail.

**Parameters:**

- `assignment1Id` - First assignment ID
- `assignment2Id` - Second assignment ID
- `repository` - Repository instance for persistence
- `userContext` - User context for audit (optional)

**Returns:** Promise<void>

**Features:**

- Uses existing repository `swapAssignments()` method
- Creates detailed audit trail with before/after information
- Validates that both assignments exist before swapping

```javascript
await swapAssignments("assign_1", "assign_2", repository, {
  actor: "admin@example.com",
  role: "ADMIN",
});
```

### `multiAssignShifts(shiftIds, disponentName, repository, userContext)`

Assigns multiple shifts to a single Disponent.

**Parameters:**

- `shiftIds` - Array of shift IDs to assign
- `disponentName` - Name of the Disponent to assign to
- `repository` - Repository instance for persistence
- `userContext` - User context for audit (optional)

**Returns:** Promise<{assignments, failures}> - Results with successes and failures

**Features:**

- Handles partial failures gracefully
- Returns detailed results including both successes and failures
- Creates audit trail with assignment count

```javascript
const result = await multiAssignShifts(
  ["shift_1", "shift_2"],
  "John Doe",
  repository,
);
console.log(`Assigned ${result.assignments.length} shifts`);
console.log(`Failed ${result.failures.length} assignments`);
```

### `multiUnassignShifts(shiftIds, repository, userContext)`

Removes assignments from multiple shifts.

**Parameters:**

- `shiftIds` - Array of shift IDs to unassign
- `repository` - Repository instance for persistence
- `userContext` - User context for audit (optional)

**Returns:** Promise<{unassignments, failures}> - Results with successes and failures

**Features:**

- Finds and removes all assignments for each shift
- Handles multiple assignments per shift
- Returns detailed results including successes and failures

```javascript
const result = await multiUnassignShifts(["shift_1", "shift_2"], repository);
console.log(`Unassigned ${result.unassignments.length} assignments`);
```

### `handleMultiSelect(currentSelection, clickedItemId, allItems, isShiftClick, isCtrlClick)`

Enhanced multi-select functionality with shift+click range selection.

**Parameters:**

- `currentSelection` - Currently selected item IDs
- `clickedItemId` - ID of the clicked item
- `allItems` - Array of all available items
- `isShiftClick` - Whether shift key was held
- `isCtrlClick` - Whether ctrl/cmd key was held

**Returns:** Array - New selection array

**Features:**

- Normal click: replace selection
- Ctrl/Cmd+click: toggle individual items
- Shift+click: select range from last selected to clicked item

```javascript
const newSelection = handleMultiSelect(
  currentSelection,
  clickedShiftId,
  allShifts,
  event.shiftKey,
  event.ctrlKey || event.metaKey,
);
```

## Integration Example

See `src/ui/BulkOperationsDemo.jsx` for a complete integration example showing how to:

1. Use enhanced multi-select with keyboard modifiers
2. Implement bulk operation buttons
3. Handle operation results and errors
4. Display progress and feedback to users

## Audit Trail

All bulk operations create detailed audit entries using the existing `AuditService`:

```javascript
// Example audit entry for week copy
{
  "action": "week_copied",
  "actor": "john.doe@example.com",
  "role": "MANAGER",
  "details": {
    "sourceWeekCount": 14,
    "copiedWeekCount": 14,
    "sourceWeeks": ["2025-01-06", "2025-01-13"]
  },
  "count": 14
}

// Example audit entry for swap
{
  "action": "assignments_swapped",
  "actor": "admin@example.com",
  "role": "ADMIN",
  "details": {
    "assignment1": {
      "id": "assign_1",
      "disponentFrom": "John Doe",
      "shiftId": "shift_1"
    },
    "assignment2": {
      "id": "assign_2",
      "disponentFrom": "Jane Smith",
      "shiftId": "shift_2"
    },
    "swapTimestamp": "2025-01-15T10:30:00.000Z"
  },
  "count": 2
}
```

## Error Handling

All functions include comprehensive error handling:

- Input validation with descriptive error messages
- Graceful handling of partial failures in bulk operations
- Audit trail for both successful operations and failures
- Detailed error information in results

## Testing

The implementation includes comprehensive tests (`src/tests/bulk-operations.test.js`) covering:

- All main functions with success scenarios
- Error handling and edge cases
- Multi-select behavior with all keyboard combinations
- Input validation
- Audit trail verification

Run tests with: `npm test src/tests/bulk-operations.test.js`

## Browser Compatibility

The bulk operations work in all modern browsers that support:

- ES6+ features (arrow functions, async/await, Set objects)
- DOM event handling for keyboard modifiers
- Local storage for audit trails

## Performance Considerations

- Operations are processed sequentially to avoid overwhelming the database
- Partial failure handling prevents all-or-nothing scenarios
- Audit entries use a ring buffer to prevent storage overflow
- UI provides feedback during long-running operations
