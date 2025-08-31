import React from "react";
import { Routes, Route } from "react-router-dom";

import { ROLES } from "../utils/constants";

import {
  PermissionGuard,
  RoleGuard,
  PermissionCheck,
  RoleCheck,
  useUserCapabilities,
} from "./RouteGuards";

/**
 * Example component demonstrating RBAC integration in the frontend
 * This shows how route guards and permission checks work in practice
 */

// Example protected pages
const AdminPage = () => (
  <div className="p-4">
    <h1>Admin Dashboard</h1>
    <p>Only admins can see this</p>
  </div>
);
const ManagementPage = () => (
  <div className="p-4">
    <h1>Management Dashboard</h1>
    <p>Chiefs and admins can see this</p>
  </div>
);
const ShiftManagementPage = () => (
  <div className="p-4">
    <h1>Shift Management</h1>
    <p>Users who can manage shifts see this</p>
  </div>
);
const AnalyticsPage = () => (
  <div className="p-4">
    <h1>Analytics</h1>
    <p>Anyone with analytics permission can see this</p>
  </div>
);
const AuditPage = () => (
  <div className="p-4">
    <h1>Audit Log</h1>
    <p>Admin-only audit information</p>
  </div>
);

// Component showing conditional rendering based on permissions
const NavigationMenu = () => {
  const capabilities = useUserCapabilities();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="space-y-2">
        <li>
          <a href="/" className="block hover:bg-gray-700 p-2 rounded">
            Dashboard
          </a>
        </li>

        {/* Show analytics link if user can view analytics */}
        <PermissionCheck permission="canViewAnalytics">
          <li>
            <a
              href="/analytics"
              className="block hover:bg-gray-700 p-2 rounded"
            >
              Analytics
            </a>
          </li>
        </PermissionCheck>

        {/* Show shift management if user can manage shifts */}
        <PermissionCheck permission="canManageShifts">
          <li>
            <a
              href="/shifts/manage"
              className="block hover:bg-gray-700 p-2 rounded"
            >
              Manage Shifts
            </a>
          </li>
        </PermissionCheck>

        {/* Show management section for chiefs and admins */}
        <RoleCheck allowedRoles={[ROLES.ADMIN, ROLES.CHIEF]}>
          <li>
            <a
              href="/management"
              className="block hover:bg-gray-700 p-2 rounded"
            >
              Management
            </a>
          </li>
        </RoleCheck>

        {/* Show audit log only for admins */}
        <RoleCheck allowedRoles={ROLES.ADMIN}>
          <li>
            <a href="/audit" className="block hover:bg-gray-700 p-2 rounded">
              Audit Log
            </a>
          </li>
        </RoleCheck>
      </ul>

      {/* Display current user capabilities */}
      <div className="mt-4 p-2 bg-gray-700 rounded text-sm">
        <h3 className="font-semibold mb-2">Your Permissions:</h3>
        <ul className="text-xs space-y-1">
          <li>Manage Shifts: {capabilities.canManageShifts ? "✓" : "✗"}</li>
          <li>View Audit: {capabilities.canViewAudit ? "✓" : "✗"}</li>
          <li>
            Apply for Shifts: {capabilities.canApplyForShifts ? "✓" : "✗"}
          </li>
          <li>View Analytics: {capabilities.canViewAnalytics ? "✓" : "✗"}</li>
          <li>Assign Shifts: {capabilities.canAssignShifts ? "✓" : "✗"}</li>
          <li>
            Manage Templates: {capabilities.canManageTemplates ? "✓" : "✗"}
          </li>
        </ul>
      </div>
    </nav>
  );
};

// Main component showing all route guards in action
const RBACDemo = () => {
  return (
    <div className="flex">
      <NavigationMenu />

      <main className="flex-1">
        <Routes>
          {/* Public route */}
          <Route
            path="/"
            element={
              <div className="p-4">
                <h1>Welcome</h1>
                <p>This page is accessible to everyone</p>
              </div>
            }
          />

          {/* Permission-based route guards */}
          <Route
            path="/analytics"
            element={
              <PermissionGuard permission="canViewAnalytics">
                <AnalyticsPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/shifts/manage"
            element={
              <PermissionGuard permission="canManageShifts">
                <ShiftManagementPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/audit"
            element={
              <PermissionGuard permission="canViewAudit">
                <AuditPage />
              </PermissionGuard>
            }
          />

          {/* Role-based route guards */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={ROLES.ADMIN}>
                <AdminPage />
              </RoleGuard>
            }
          />

          <Route
            path="/management"
            element={
              <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.CHIEF]}>
                <ManagementPage />
              </RoleGuard>
            }
          />

          {/* Fallback for unauthorized access */}
          <Route
            path="*"
            element={
              <div className="p-4">
                <h1>Access Denied</h1>
                <p>You don&apos;t have permission to access this page.</p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default RBACDemo;
