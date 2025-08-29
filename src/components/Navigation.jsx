import { NavLink } from 'react-router-dom'
// reference to satisfy strict unused var rule in certain test contexts
const _navLinkRef = NavLink
import { useContext } from 'react'

import { useFeedback } from '../contexts/useFeedback'
import AuthContext from '../contexts/AuthContext'
import { canViewAudit } from '../utils/auth'

import ActiveRoleBadge from './ActiveRoleBadge'
import VersionBadge from './VersionBadge'

// AuthContext imported above

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navigation() {
  const auth = useContext(AuthContext)
  const role = auth?.user?.role
  const isAdmin = role === 'admin' || role === 'chief'
  const navigation = [
  { name: 'Übersicht', href: '/' },
  { name: 'Kalender', href: '/calendar' },
  isAdmin && { name: 'Verwaltung', href: '/admin' },
  canViewAudit(role) && { name: 'Audit', href: '/audit' },
  { name: '🧪 Test', href: '/test' },
  ].filter(Boolean)

  return (
  <nav className="bg-[var(--color-primary)]" aria-label="Hauptnavigation">
      <div className="mx-auto max-w-7xl" style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)' }}>
        <div className="flex justify-between" style={{ height: 'var(--space-16)' }}>
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <span className="text-white font-bold text-xl flex items-center">swaxi <VersionBadge /></span>
            </div>
            <div className="hidden sm:flex items-center" style={{ marginLeft: 'var(--space-6)', gap: 'var(--space-8)' }}>
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    classNames(
                      isActive
                        ? 'border-brand-accent text-white'
                        : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white',
                      'inline-flex items-center border-b-2 text-sm font-medium'
                    )
                  }
                  style={{ paddingLeft: 'var(--space-1)', paddingTop: 'var(--space-1)' }}
                >
                  {item.name}
                </NavLink>
              ))}
              <span className="flex-1" aria-hidden="true" />
              {auth?.user && (
                <ActiveRoleBadge style={{ marginLeft: 'var(--space-4)' }} />
              )}
              {!auth?.user && (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    classNames(
                      isActive ? 'border-brand-accent text-white' : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white',
                      'inline-flex items-center border-b-2 text-sm font-medium'
                    )
                  }
                  style={{ paddingLeft: 'var(--space-1)', paddingTop: 'var(--space-1)' }}
                >Anmelden</NavLink>
              )}
              {auth?.user && (
                <button
                  onClick={auth.logout}
                  className="inline-flex items-center border-b-2 border-transparent text-sm font-medium text-gray-300 hover:text-white hover:border-gray-300"
                  aria-label={`Abmelden (${auth.user.role})`}
                  title="Aktuelle Sitzung beenden"
                  style={{ paddingLeft: 'var(--space-1)', paddingTop: 'var(--space-1)' }}
                >Abmelden ({auth.user.role})</button>
              )}
            </div>
          </div>
          <FeedbackNavControl />
        </div>
      </div>
    </nav>
  )
}

function FeedbackNavControl() {
  // separate component so hook order remains stable if provider absent in isolated tests
  try {
    const fb = useFeedback()
    return (
      <div className="flex items-center">
  <button onClick={fb.open} className="text-sm text-gray-300 hover:text-white border border-transparent hover:border-gray-300 rounded" aria-haspopup="dialog" title="Feedback geben / Problem melden" style={{ marginLeft: 'var(--space-4)', paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)', paddingTop: 'var(--space-1)', paddingBottom: 'var(--space-1)' }}>Feedback</button>
      </div>
    )
  } catch {
    return null
  }
}

