import { useMemo } from 'react'
import { EyeIcon } from '@heroicons/react/24/outline'

import { useShifts } from '../contexts/useShifts'
import { SHIFT_STATUS } from '../utils/constants'

export default function MiniAnalytics({ onViewSource }) {
  const { state } = useShifts();
  
  // Memoized calculations for performance (≤2ms on 500 rows)
  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // Calculate all metrics in a single pass for performance
    let openShifts = 0
    let assignedToday = 0
    let totalConflicts = 0
    
    state.shifts.forEach(shift => {
      // Open shifts
      if (shift.status === SHIFT_STATUS.OPEN) {
        openShifts++
      }
      
      // Assigned today
      if (shift.status === SHIFT_STATUS.ASSIGNED) {
        const shiftDate = new Date(shift.date)
        shiftDate.setHours(0, 0, 0, 0)
        if (shiftDate.getTime() === today.getTime()) {
          assignedToday++
        }
      }
      
      // Total conflicts
      if (shift.conflicts?.length > 0) {
        totalConflicts++
      }
    })
    
    // Applications last 7 days
    const applicationsLast7d = state.applications.filter(app => 
      app.ts && app.ts >= sevenDaysAgo.getTime()
    ).length
    
    return [
      {
        id: 'open',
        name: 'Offene Dienste',
        value: openShifts,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: 'clock'
      },
      {
        id: 'assigned-today',
        name: 'Zugewiesen heute',
        value: assignedToday,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: 'check'
      },
      {
        id: 'conflicts',
        name: 'Aktive Konflikte',
        value: totalConflicts,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: 'warning'
      },
      {
        id: 'applications-7d',
        name: 'Bewerbungen 7T',
        value: applicationsLast7d,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: 'user'
      }
    ]
  }, [state.shifts, state.applications]);

  const handleViewSource = (statId) => {
    if (onViewSource) {
      onViewSource(statId)
    }
  }

  const getIcon = (iconType) => {
    const iconClass = "h-6 w-6"
    switch (iconType) {
      case 'clock':
        return <div className={`${iconClass} rounded-full border-2 border-current`} />
      case 'check':
        return <div className={`${iconClass} relative`}>
          <div className="absolute inset-1 border-b-2 border-r-2 border-current transform rotate-45" />
        </div>
      case 'warning':
        return <div className={`${iconClass} relative`}>
          <div className="absolute inset-1 border-2 border-current border-b-0 transform rotate-180" 
               style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} />
        </div>
      case 'user':
        return <div className={`${iconClass} rounded-full border-2 border-current relative`}>
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-current" />
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-2 rounded-t-full bg-current" />
        </div>
      default:
        return <div className={iconClass} />
    }
  }

  return (
    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
        >
          <dt>
            <div className={`absolute rounded-md ${stat.bgColor} p-3`}>
              <div className={stat.color} aria-hidden="true">
                {getIcon(stat.icon)}
              </div>
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
          </dt>
          <dd className="ml-16 flex items-baseline justify-between pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            {onViewSource && (
              <button
                onClick={() => handleViewSource(stat.id)}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                aria-label={`Datenquelle für ${stat.name} anzeigen`}
                title={`Gefilterte Liste für ${stat.name} anzeigen`}
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
