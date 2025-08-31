# RBAC Integration Guide

This guide shows how to integrate the newly implemented RBAC (Role-Based Access Control) system into the Swaxi Dispo application.

## Backend Integration

### 1. Express.js Server Setup

```javascript
const express = require('express');
const { requirePermission, requireRole, guardResource } = require('./backend/rbac.js');

const app = express();

// Protect API endpoints
app.get('/api/shifts', requirePermission('canViewAnalytics'), (req, res) => {
  // Only users with analytics permission can view shifts
});

app.post('/api/shifts', requirePermission('canManageShifts'), (req, res) => {
  // Only users who can manage shifts can create them
});

app.get('/api/audit', requireRole('admin'), (req, res) => {
  // Only admins can access audit logs
});

app.post('/api/shifts/:id/assign', guardResource('shifts', 'assign'), (req, res) => {
  // Only users who can assign shifts (chiefs and admins) can assign
});
```

### 2. Available Middleware

- `requirePermission(permission)` - Checks if user has specific permission
- `requireRole(role|roles)` - Checks if user has specific role(s)
- `guardResource(resource, action)` - Checks resource-action combinations

### 3. Available Permissions

- `canManageShifts` - Create/edit/delete shifts (Chief+)
- `canViewAudit` - View audit logs (Admin only)
- `canApplyForShifts` - Apply for shifts (Disponent+)
- `canViewAnalytics` - View analytics (Analyst+)
- `canAssignShifts` - Assign shifts to users (Chief+)
- `canManageTemplates` - Manage shift templates (Chief+)

## Frontend Integration

### 1. Route Protection

```javascript
import { PermissionGuard, RoleGuard } from '../components/RouteGuards';

// In your App.jsx routes:
<Routes>
  {/* Protect admin page with role guard */}
  <Route 
    path="/admin" 
    element={
      <RoleGuard allowedRoles="admin">
        <Administration />
      </RoleGuard>
    } 
  />
  
  {/* Protect audit page with permission guard */}
  <Route 
    path="/audit" 
    element={
      <PermissionGuard permission="canViewAudit">
        <Audit />
      </PermissionGuard>
    } 
  />
  
  {/* Multiple roles allowed */}
  <Route 
    path="/management" 
    element={
      <RoleGuard allowedRoles={['admin', 'chief']}>
        <Management />
      </RoleGuard>
    } 
  />
</Routes>
```

### 2. Conditional Rendering

```javascript
import { PermissionCheck, RoleCheck, useUserCapabilities } from '../components/RouteGuards';

function Navigation() {
  const capabilities = useUserCapabilities();
  
  return (
    <nav>
      {/* Show only if user can manage shifts */}
      <PermissionCheck permission="canManageShifts">
        <button>Create Shift</button>
      </PermissionCheck>
      
      {/* Show only for admins */}
      <RoleCheck allowedRoles="admin">
        <button>Admin Panel</button>
      </RoleCheck>
      
      {/* Use capabilities object */}
      {capabilities.canViewAudit && <button>View Audit</button>}
    </nav>
  );
}
```

### 3. Hooks

```javascript
import { usePermission, useRole, useUserCapabilities } from '../components/RouteGuards';

function MyComponent() {
  const canManage = usePermission('canManageShifts');
  const isAdmin = useRole('admin');
  const isManager = useRole(['admin', 'chief']);
  const capabilities = useUserCapabilities();
  
  return (
    <div>
      {canManage && <button>Manage Shifts</button>}
      {isAdmin && <button>Admin Functions</button>}
      {isManager && <button>Management Dashboard</button>}
    </div>
  );
}
```

## Quick Integration for Existing Routes

To quickly add protection to existing routes in App.jsx:

```javascript
// Before
<Route path="/admin" element={<Administration />} />
<Route path="/audit" element={<Audit />} />

// After  
<Route 
  path="/admin" 
  element={
    <RoleGuard allowedRoles={['admin', 'chief']}>
      <Administration />
    </RoleGuard>
  } 
/>
<Route 
  path="/audit" 
  element={
    <PermissionGuard permission="canViewAudit">
      <Audit />
    </PermissionGuard>
  } 
/>
```

## Role Hierarchy

1. **ADMIN** - Full access to everything
2. **CHIEF** - Manage shifts, assign shifts, manage templates, view analytics (NO audit access)
3. **DISPONENT** - Apply for shifts, view analytics (NO management functions)
4. **ANALYST** - View analytics only (READ-ONLY)

## Testing

The RBAC system includes comprehensive tests:

```bash
# Run backend RBAC tests
npm test backend/rbac.test.js

# Run existing auth permission tests (still passing)
npm test src/tests/authPermissions.test.js
```

## Demo Server

A demo Express.js server is included to test the middleware:

```bash
node backend/demo-server.js
```

Test with different user tokens:
```bash
# Admin (can access everything)
curl -H "Authorization: Bearer admin-token" http://localhost:3001/api/audit

# Chief (can manage but not audit)  
curl -H "Authorization: Bearer chief-token" http://localhost:3001/api/shifts -X POST

# Analyst (read-only)
curl -H "Authorization: Bearer analyst-token" http://localhost:3001/api/analytics

# Unauthorized (should fail)
curl -H "Authorization: Bearer analyst-token" http://localhost:3001/api/audit
```

## Migration Notes

- All existing auth permission tests pass unchanged
- The system is backwards compatible with existing code
- New permissions (`canAssignShifts`, `canManageTemplates`) are added to `src/utils/auth.js`
- The implementation is minimal and focused on the requirements

This RBAC system provides both page-level protection and API middleware validation as specified in the requirements.