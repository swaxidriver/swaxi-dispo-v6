import { useContext, memo } from 'react'

// AuthContext is exported as default from AuthContext.jsx
import AuthContext from '../contexts/AuthContext'
import { ROLES } from '../utils/constants'

function roleStyle(role) {
  switch (role) {
    case ROLES.ADMIN: return 'bg-cyan-600 text-white'
    case ROLES.CHIEF: return 'bg-indigo-600 text-white'
    case ROLES.DISPONENT: return 'bg-green-600 text-white'
    case ROLES.ANALYST: return 'bg-gray-600 text-white'
    default: return 'bg-gray-400 text-white'
  }
}

function ActiveRoleBadge({ className = '' }) {
  const auth = useContext(AuthContext)
  const role = auth?.user?.role
  if (!role) return null
  return (
    <span
      data-testid="active-role-badge"
      aria-label={`Aktive Rolle: ${role}`}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium shadow-sm ring-1 ring-white/20 ${roleStyle(role)} ${className}`}
    >
      {role}
    </span>
  )
}

export default memo(ActiveRoleBadge)
