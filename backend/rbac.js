/**
 * Role-Based Access Control (RBAC) Server-Side Guards
 * Provides middleware and validation for API endpoints and server-side operations
 */

// Import roles from frontend constants for consistency
const ROLES = {
  ADMIN: "admin",
  CHIEF: "chief",
  DISPONENT: "disponent",
  ANALYST: "analyst",
};

/**
 * Role hierarchy for permission checking
 * Higher numbers indicate higher privilege levels
 */
const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 4,
  [ROLES.CHIEF]: 3,
  [ROLES.DISPONENT]: 2,
  [ROLES.ANALYST]: 1,
};

/**
 * Check if user has required permission level
 * @param {string} userRole - User's current role
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean} - Whether user has permission
 */
function hasPermission(userRole, requiredRole) {
  if (!userRole || !requiredRole) {
    return false;
  }

  const userLevel = ROLE_HIERARCHY[userRole];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Permission checkers for specific capabilities
 */
const Permissions = {
  /**
   * Can manage shifts (create, edit, delete)
   */
  canManageShifts: (userRole) => hasPermission(userRole, ROLES.CHIEF),

  /**
   * Can view audit logs (admin only)
   */
  canViewAudit: (userRole) => hasPermission(userRole, ROLES.ADMIN),

  /**
   * Can apply for shifts
   */
  canApplyForShifts: (userRole) => hasPermission(userRole, ROLES.DISPONENT),

  /**
   * Can view analytics
   */
  canViewAnalytics: (userRole) => hasPermission(userRole, ROLES.ANALYST),

  /**
   * Can assign shifts to users
   */
  canAssignShifts: (userRole) => hasPermission(userRole, ROLES.CHIEF),

  /**
   * Can manage shift templates
   */
  canManageTemplates: (userRole) => hasPermission(userRole, ROLES.CHIEF),
};

/**
 * Extract user role from request
 * @param {Object} req - Express request object
 * @returns {string|null} - User role or null if not found
 */
function extractUserRole(req) {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      // In a real implementation, this would decode JWT token
      const token = authHeader.substring(7);
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());
      return decoded.role;
    } catch (error) {
      // Invalid token format
    }
  }

  // Check session (for session-based auth)
  if (req.session && req.session.user) {
    return req.session.user.role;
  }

  // Check user object directly (for testing)
  if (req.user && req.user.role) {
    return req.user.role;
  }

  return null;
}

/**
 * Express middleware factory for role-based access control
 * @param {string} requiredPermission - Required permission key
 * @returns {Function} - Express middleware function
 */
function requirePermission(requiredPermission) {
  return (req, res, next) => {
    const userRole = extractUserRole(req);

    if (!userRole) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!Permissions[requiredPermission]) {
      return res.status(500).json({
        error: "Internal Error",
        message: "Invalid permission check",
      });
    }

    if (!Permissions[requiredPermission](userRole)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Insufficient permissions. Required: ${requiredPermission}`,
      });
    }

    // Add user info to request for downstream handlers
    req.userRole = userRole;
    next();
  };
}

/**
 * Express middleware factory for specific role requirement
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} - Express middleware function
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const userRole = extractUserRole(req);

    if (!userRole) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    req.userRole = userRole;
    next();
  };
}

/**
 * Guard for API endpoints based on resource and action
 * @param {string} resource - Resource being accessed (e.g., 'shifts', 'audit')
 * @param {string} action - Action being performed (e.g., 'read', 'write', 'delete')
 * @returns {Function} - Express middleware function
 */
function guardResource(resource, action) {
  return (req, res, next) => {
    const userRole = extractUserRole(req);

    if (!userRole) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    let hasAccess = false;

    // Define resource-action permissions
    switch (resource) {
      case "shifts":
        if (action === "read") {
          hasAccess = Permissions.canViewAnalytics(userRole);
        } else if (
          action === "write" ||
          action === "create" ||
          action === "update"
        ) {
          hasAccess = Permissions.canManageShifts(userRole);
        } else if (action === "delete") {
          hasAccess = Permissions.canManageShifts(userRole);
        } else if (action === "apply") {
          hasAccess = Permissions.canApplyForShifts(userRole);
        } else if (action === "assign") {
          hasAccess = Permissions.canAssignShifts(userRole);
        }
        break;

      case "audit":
        if (action === "read") {
          hasAccess = Permissions.canViewAudit(userRole);
        }
        // Only admins can write to audit (system actions)
        break;

      case "templates":
        if (action === "read") {
          hasAccess = Permissions.canViewAnalytics(userRole);
        } else {
          hasAccess = Permissions.canManageTemplates(userRole);
        }
        break;

      case "analytics":
        hasAccess = Permissions.canViewAnalytics(userRole);
        break;

      default:
        hasAccess = false;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Access denied for ${action} on ${resource}`,
      });
    }

    req.userRole = userRole;
    next();
  };
}

/**
 * Validate user context for audit logging
 * @param {Object} req - Express request object
 * @returns {Object} - User context object
 */
function getUserContext(req) {
  const userRole = extractUserRole(req);

  if (!userRole) {
    return {
      actor: "Anonymous",
      role: "anonymous",
    };
  }

  // Extract additional user info if available
  let actor = "Unknown User";

  if (req.user) {
    actor = req.user.email || req.user.name || req.user.id || "Unknown User";
  } else if (req.session && req.session.user) {
    actor =
      req.session.user.email ||
      req.session.user.name ||
      req.session.user.id ||
      "Unknown User";
  }

  return {
    actor,
    role: userRole,
  };
}

// Export both named exports for ES modules
export {
  ROLES,
  ROLE_HIERARCHY,
  hasPermission,
  Permissions,
  extractUserRole,
  requirePermission,
  requireRole,
  guardResource,
  getUserContext,
};
