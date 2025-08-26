import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
// linter reference
const _refs = [Menu, Transition, BellIcon]
import { useShifts } from '../contexts/useShifts'

export default function NotificationMenu() {
  const { state, markNotificationRead, markAllNotificationsRead } = useShifts();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex items-center rounded-full bg-gray-50 p-1 text-gray-400 hover:text-gray-600">
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {state.notifications && state.notifications.length > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {state.notifications?.length > 0 && (
            <div className="px-3 py-1 flex justify-end border-b border-gray-100 text-xs">
              <button onClick={markAllNotificationsRead} className="text-blue-600 hover:underline">Alle gelesen</button>
            </div>
          )}
          {state.notifications && state.notifications.map((notification) => (
            <Menu.Item key={notification.id}>
              {({ active }) => (
                <div
                  className={`
                    ${active ? 'bg-gray-100' : ''}
                    px-4 py-2 text-sm text-gray-700
                  `}
                >
                  <p className="font-medium flex justify-between items-center">
                    <span>{notification.title}</span>
                    {!notification.isRead && (
                      <button onClick={() => markNotificationRead(notification.id)} className="ml-2 text-xs text-blue-600 hover:underline">Gelesen</button>
                    )}
                  </p>
                  <p className="text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1 flex justify-between items-center">
                    <span>{notification.timestamp}</span>
                    {!notification.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                  </p>
                </div>
              )}
            </Menu.Item>
          ))}
          {(!state.notifications || state.notifications.length === 0) && (
            <div className="px-4 py-2 text-sm text-gray-500">
              Keine neuen Benachrichtigungen
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
