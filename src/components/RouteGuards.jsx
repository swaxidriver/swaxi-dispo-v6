import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import { Permissions } from "../utils/auth.js";

/**
 * Higher-order component for protecting routes based on user permissions
 * @param {Object} props - Component props
 * @param {React.Component} props.children - Protected component to render
 * @param {string} props.permission - Required permission key
 * @param {string} props.fallbackPath - Path to redirect if access denied (default: '/')
 * @returns {React.Component} - Protected component or redirect
 */
export function PermissionGuard({ children, permission, fallbackPath = "/" }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Not authenticated
  if (!user || !user.role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permission
  if (!Permissions[permission] || !Permissions[permission](user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

/**
 * Higher-order component for protecting routes based on specific roles
 * @param {Object} props - Component props
 * @param {React.Component} props.children - Protected component to render
 * @param {string|string[]} props.allowedRoles - Single role or array of allowed roles
 * @param {string} props.fallbackPath - Path to redirect if access denied (default: '/')
 * @returns {React.Component} - Protected component or redirect
 */
export function RoleGuard({ children, allowedRoles, fallbackPath = "/" }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Not authenticated
  if (!user || !user.role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

/**
 * Component for conditional rendering based on permissions
 * @param {Object} props - Component props
 * @param {React.Component} props.children - Component to render if permission granted
 * @param {string} props.permission - Required permission key
 * @param {React.Component} props.fallback - Component to render if permission denied
 * @returns {React.Component} - Children or fallback component
 */
export function PermissionCheck({ children, permission, fallback = null }) {
  const { user } = useContext(AuthContext);

  // Not authenticated or no permission
  if (
    !user ||
    !user.role ||
    !Permissions[permission] ||
    !Permissions[permission](user.role)
  ) {
    return fallback;
  }

  return children;
}

/**
 * Component for conditional rendering based on roles
 * @param {Object} props - Component props
 * @param {React.Component} props.children - Component to render if role matches
 * @param {string|string[]} props.allowedRoles - Single role or array of allowed roles
 * @param {React.Component} props.fallback - Component to render if role doesn't match
 * @returns {React.Component} - Children or fallback component
 */
export function RoleCheck({ children, allowedRoles, fallback = null }) {
  const { user } = useContext(AuthContext);

  // Not authenticated
  if (!user || !user.role) {
    return fallback;
  }

  // Check roles
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user.role)) {
    return fallback;
  }

  return children;
}

/**
 * Hook for checking user permissions
 * @param {string} permission - Permission key to check
 * @returns {boolean} - Whether user has permission
 */
export function usePermission(permission) {
  const { user } = useContext(AuthContext);

  if (!user || !user.role || !Permissions[permission]) {
    return false;
  }

  return Permissions[permission](user.role);
}

/**
 * Hook for checking user roles
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {boolean} - Whether user has one of the allowed roles
 */
export function useRole(allowedRoles) {
  const { user } = useContext(AuthContext);

  if (!user || !user.role) {
    return false;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(user.role);
}

/**
 * Hook for getting current user's role capabilities
 * @returns {Object} - Object with boolean flags for each capability
 */
export function useUserCapabilities() {
  const { user } = useContext(AuthContext);

  if (!user || !user.role) {
    return {
      canManageShifts: false,
      canViewAudit: false,
      canApplyForShifts: false,
      canViewAnalytics: false,
      canAssignShifts: false,
      canManageTemplates: false,
    };
  }

  return {
    canManageShifts: Permissions.canManageShifts(user.role),
    canViewAudit: Permissions.canViewAudit(user.role),
    canApplyForShifts: Permissions.canApplyForShifts(user.role),
    canViewAnalytics: Permissions.canViewAnalytics(user.role),
    canAssignShifts: Permissions.canAssignShifts(user.role),
    canManageTemplates: Permissions.canManageTemplates(user.role),
  };
}
