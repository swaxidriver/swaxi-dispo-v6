import { useShifts } from '../contexts/useShifts'
import { SHIFT_STATUS } from '../utils/constants'

export default function MiniAnalytics() {
  const { state } = useShifts();
  
  const stats = [
    {
      name: 'Offene Dienste',
      value: state.shifts.filter(s => s.status === SHIFT_STATUS.OPEN).length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Zugewiesene Dienste',
      value: state.shifts.filter(s => s.status === SHIFT_STATUS.ASSIGNED).length,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Abgesagte Dienste',
      value: state.shifts.filter(s => s.status === SHIFT_STATUS.CANCELLED).length,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Aktive Konflikte',
      value: state.shifts.filter(s => s.conflicts?.length > 0).length,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ];

  return (
    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
        >
          <dt>
            <div className={`absolute rounded-md ${stat.bgColor} p-3`}>
              <div className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
          </dd>
        </div>
      ))}
    </dl>
  )
}
