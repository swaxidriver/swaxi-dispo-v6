import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { describeConflicts, categorizeConflicts } from "../utils/conflicts";

import Tooltip from "./Tooltip";

/**
 * Conflict badge with tooltip showing conflict details
 * Displays different styling for warnings vs blocking conflicts
 */
function ConflictBadge({ conflicts = [], className = "" }) {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const conflictCount = conflicts.length;
  const conflictDescriptions = describeConflicts(conflicts);
  const tooltipContent = conflictDescriptions.join(", ");
  const { warnings, blocking } = categorizeConflicts(conflicts);

  // Use red for blocking conflicts, orange for warnings only
  const hasBlocking = blocking.length > 0;
  const badgeClasses = hasBlocking
    ? "text-red-800 bg-red-100 border-red-200"
    : "text-orange-800 bg-orange-100 border-orange-200";

  return (
    <Tooltip content={tooltipContent} data-testid="conflict-tooltip">
      <div
        className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded-full ${badgeClasses} ${className}`}
        aria-label={`${conflictCount} Konflikt${conflictCount > 1 ? "e" : ""}: ${tooltipContent}`}
        data-testid="conflict-badge"
      >
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
        <span>
          {conflictCount} Konflikt{conflictCount > 1 ? "e" : ""}
        </span>
      </div>
    </Tooltip>
  );
}

export default ConflictBadge;
