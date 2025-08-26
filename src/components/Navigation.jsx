import { NavLink } from 'react-router-dom'
// reference to satisfy strict unused var rule in certain test contexts
const _navLinkRef = NavLink
import { useContext } from 'react'

import AuthContext from '../contexts/AuthContext'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navigation() {
  const auth = useContext(AuthContext)
  const role = auth?.user?.role
  const isAdmin = role === 'admin' || role === 'chief'
  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Kalender', href: '/calendar' },
    isAdmin && { name: 'Verwaltung', href: '/admin' },
    isAdmin && { name: 'Audit', href: '/audit' },
    { name: '🧪 Test', href: '/test' },
  ].filter(Boolean)

  return (
    <nav className="bg-brand-primary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <span className="text-white font-bold text-xl">swaxi</span>
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
              {!auth?.user && (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    classNames(
                      isActive ? 'border-brand-accent text-white' : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white',
                      'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                    )
                  }
                >Login</NavLink>
              )}
              {auth?.user && (
                <button
                  onClick={auth.logout}
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-300"
                >Logout ({auth.user.role})</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
