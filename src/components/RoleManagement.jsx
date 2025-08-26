import { useState } from 'react';

import { ROLES } from '../utils/constants';
import { canManageShifts } from '../utils/auth';

const roleDescriptions = {
  [ROLES.ADMIN]: 'Vollzugriff inkl. Audit-Log und Rollenverwaltung',
  [ROLES.CHIEF]: 'Dienste anlegen, zuweisen und Vorlagen bearbeiten',
  [ROLES.DISPONENT]: 'Dienste sehen und sich bewerben',
  [ROLES.ANALYST]: 'Nur Lesezugriff und Analytics',
};

export default function RoleManagement({ users, onUpdateRole }) {
  const [editingUser, setEditingUser] = useState(null);

  const handleRoleChange = (userId, newRole) => {
    onUpdateRole(userId, newRole);
    setEditingUser(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case ROLES.CHIEF:
        return 'bg-blue-100 text-blue-800';
      case ROLES.DISPONENT:
        return 'bg-green-100 text-green-800';
      case ROLES.ANALYST:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {users.map((user) => (
          <li key={user.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-brand-primary">
                  {user.name}
                </div>
                <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                  {editingUser === user.id ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-primary sm:text-sm sm:leading-6"
                    >
                      {Object.values(ROLES).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                      {canManageShifts(user.role) && (
                        <button
                          onClick={() => setEditingUser(user.id)}
                          className="text-sm text-brand-primary hover:text-brand-primary/80"
                        >
                          Bearbeiten
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {roleDescriptions[user.role]}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
