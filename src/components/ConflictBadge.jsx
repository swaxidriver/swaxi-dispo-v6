import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'

import { describeConflicts } from '../utils/conflicts'
import Tooltip from './Tooltip'

/**
 * Conflict badge with tooltip showing conflict details
 * Displays a warning icon with the number of conflicts
 */
function ConflictBadge({ conflicts = [], className = '' }) {
  if (!conflicts || conflicts.length === 0) {
    return null
  }

  const conflictCount = conflicts.length
  const conflictDescriptions = describeConflicts(conflicts)
  const tooltipContent = conflictDescriptions.join(', ')

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={`inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 border border-red-200 rounded-full ${className}`}
        aria-label={`${conflictCount} Konflikt${conflictCount > 1 ? 'e' : ''}: ${tooltipContent}`}
      >
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
        <span>{conflictCount} Konflikt{conflictCount > 1 ? 'e' : ''}</span>
      </div>
    </Tooltip>
  )
}

export default ConflictBadge