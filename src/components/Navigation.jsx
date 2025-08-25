import { Link, useLocation } from 'react-router-dom'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navigation() {
  const location = useLocation()
  
  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Kalender', href: '/calendar' },
    { name: 'Verwaltung', href: '/admin' },
    { name: 'Audit', href: '/audit' },
  ]

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
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    item.href === location.pathname
                      ? 'border-brand-accent text-white'
                      : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white',
                    'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
