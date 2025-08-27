import { NavLink } from 'react-router-dom'
// reference to satisfy strict unused var rule in certain test contexts
const _navLinkRef = NavLink
import { useContext } from 'react'

import { useFeedback } from '../contexts/useFeedback'
import AuthContext from '../contexts/AuthContext'

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
  isAdmin && { name: 'Audit', href: '/audit' },
  { name: '🧪 Test', href: '/test' },
  ].filter(Boolean)

  return (
  <nav className="bg-[var(--color-primary)]" aria-label="Hauptnavigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <span className="text-white font-bold text-xl flex items-center">swaxi <VersionBadge /></span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
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
                      'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              <span className="flex-1" aria-hidden="true" />
              {auth?.user && (
                <ActiveRoleBadge className="ml-4" />
              )}
              {!auth?.user && (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    classNames(
                      isActive ? 'border-brand-accent text-white' : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white',
                      'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                    )
                  }
                >Anmelden</NavLink>
              )}
              {auth?.user && (
                <button
                  onClick={auth.logout}
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-300"
                  aria-label={`Abmelden (${auth.user.role})`}
                  title="Aktuelle Sitzung beenden"
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
  <button onClick={fb.open} className="ml-4 text-sm text-gray-300 hover:text-white border border-transparent hover:border-gray-300 rounded px-3 py-1" aria-haspopup="dialog" title="Feedback geben / Problem melden">Feedback</button>
      </div>
    )
  } catch {
    return null
  }
}

