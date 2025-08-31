/**
 * Example Express.js server integration using the RBAC middleware
 * This demonstrates how to use the backend RBAC guards in a real API server
 */

import express from 'express';
import {
  requirePermission,
  requireRole,
  guardResource,
  getUserContext,
  ROLES
} from './rbac.js';

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Example middleware to simulate user authentication
// In production, this would decode JWT tokens or verify sessions
app.use((req, res, next) => {
  // Simulate different users based on Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    switch (token) {
      case 'admin-token':
        req.user = { role: ROLES.ADMIN, email: 'admin@stadtwerke-augsburg.de', name: 'Admin User' };
        break;
      case 'chief-token':
        req.user = { role: ROLES.CHIEF, email: 'chief@stadtwerke-augsburg.de', name: 'Chief Dispatcher' };
        break;
      case 'disponent-token':
        req.user = { role: ROLES.DISPONENT, email: 'disp@stadtwerke-augsburg.de', name: 'Dispatcher' };
        break;
      case 'analyst-token':
        req.user = { role: ROLES.ANALYST, email: 'analyst@stadtwerke-augsburg.de', name: 'Analyst' };
        break;
    }
  }
  next();
});

// Protected routes using different guard types

// 1. Permission-based guards
app.get('/api/shifts', requirePermission('canViewAnalytics'), (req, res) => {
  res.json({
    message: 'Shifts data',
    user: getUserContext(req),
    shifts: [
      { id: 1, type: 'Früh', date: '2025-01-15', status: 'open' },
      { id: 2, type: 'Spät', date: '2025-01-15', status: 'assigned' }
    ]
  });
});

app.post('/api/shifts', requirePermission('canManageShifts'), (req, res) => {
  const userContext = getUserContext(req);
  res.json({
    message: 'Shift created successfully',
    user: userContext,
    shift: { id: 3, ...req.body }
  });
});

// 2. Role-based guards
app.get('/api/audit', requireRole(ROLES.ADMIN), (req, res) => {
  res.json({
    message: 'Audit log data (admin only)',
    user: getUserContext(req),
    logs: [
      { id: 1, action: 'Created shift', timestamp: new Date().toISOString() }
    ]
  });
});

app.get('/api/management', requireRole([ROLES.ADMIN, ROLES.CHIEF]), (req, res) => {
  res.json({
    message: 'Management dashboard data',
    user: getUserContext(req),
    data: { totalShifts: 150, openShifts: 12 }
  });
});

// 3. Resource-action guards
app.get('/api/shifts/:id', guardResource('shifts', 'read'), (req, res) => {
  res.json({
    message: `Shift ${req.params.id} details`,
    user: getUserContext(req),
    shift: { id: req.params.id, type: 'Früh', date: '2025-01-15' }
  });
});

app.put('/api/shifts/:id', guardResource('shifts', 'update'), (req, res) => {
  res.json({
    message: `Shift ${req.params.id} updated`,
    user: getUserContext(req),
    shift: { id: req.params.id, ...req.body }
  });
});

app.post('/api/shifts/:id/apply', guardResource('shifts', 'apply'), (req, res) => {
  res.json({
    message: `Applied for shift ${req.params.id}`,
    user: getUserContext(req),
    application: { shiftId: req.params.id, status: 'pending' }
  });
});

app.post('/api/shifts/:id/assign', guardResource('shifts', 'assign'), (req, res) => {
  res.json({
    message: `Assigned shift ${req.params.id}`,
    user: getUserContext(req),
    assignment: { shiftId: req.params.id, assignedTo: req.body.userId }
  });
});

// 4. Template management
app.get('/api/templates', guardResource('templates', 'read'), (req, res) => {
  res.json({
    message: 'Shift templates',
    user: getUserContext(req),
    templates: [
      { id: 1, name: 'Frühdienst', start: '06:00', end: '14:00' }
    ]
  });
});

app.post('/api/templates', guardResource('templates', 'create'), (req, res) => {
  res.json({
    message: 'Template created',
    user: getUserContext(req),
    template: { id: 2, ...req.body }
  });
});

// 5. Analytics endpoint
app.get('/api/analytics', guardResource('analytics', 'read'), (req, res) => {
  res.json({
    message: 'Analytics data',
    user: getUserContext(req),
    analytics: {
      shiftsThisMonth: 120,
      averageAssignmentTime: '2.5 hours',
      utilizationRate: '85%'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`RBAC Demo Server running on port ${PORT}`);
  console.log('');
  console.log('Test the API with different user tokens:');
  console.log('');
  console.log('# Admin (can access everything)');
  console.log('curl -H "Authorization: Bearer admin-token" http://localhost:3001/api/audit');
  console.log('');
  console.log('# Chief (can manage but not audit)');
  console.log('curl -H "Authorization: Bearer chief-token" http://localhost:3001/api/shifts -X POST -H "Content-Type: application/json" -d \'{"type":"Früh","date":"2025-01-16"}\'');
  console.log('');
  console.log('# Analyst (read-only analytics)');
  console.log('curl -H "Authorization: Bearer analyst-token" http://localhost:3001/api/analytics');
  console.log('');
  console.log('# Unauthorized access (should fail)');
  console.log('curl -H "Authorization: Bearer analyst-token" http://localhost:3001/api/audit');
});

export default app;