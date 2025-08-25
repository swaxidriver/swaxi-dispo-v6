import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
import { useShifts } from '../contexts/ShiftContext'

export default function NotificationMenu() {
  const { state } = useShifts();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex items-center rounded-full bg-gray-50 p-1 text-gray-400 hover:text-gray-600">
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {state.notifications.length > 0 && (
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
          {state.notifications.map((notification) => (
            <Menu.Item key={notification.id}>
              {({ active }) => (
                <div
                  className={`
                    ${active ? 'bg-gray-100' : ''}
                    px-4 py-2 text-sm text-gray-700
                  `}
                >
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{notification.timestamp}</p>
                </div>
              )}
            </Menu.Item>
          ))}
          {state.notifications.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-500">
              Keine neuen Benachrichtigungen
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
