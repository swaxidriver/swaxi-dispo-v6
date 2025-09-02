// Import for ES modules environment that needs to be tested in CommonJS Jest
import {
  ROLES,
  ROLE_HIERARCHY,
  hasPermission,
  Permissions,
  extractUserRole,
  requirePermission,
  requireRole,
  guardResource,
  getUserContext,
} from "./rbac.js";

describe("Backend RBAC System", () => {
  describe("hasPermission", () => {
    test("admin has all permissions", () => {
      expect(hasPermission(ROLES.ADMIN, ROLES.ADMIN)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, ROLES.CHIEF)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, ROLES.DISPONENT)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, ROLES.ANALYST)).toBe(true);
    });

    test("chief has appropriate permissions", () => {
      expect(hasPermission(ROLES.CHIEF, ROLES.ADMIN)).toBe(false);
      expect(hasPermission(ROLES.CHIEF, ROLES.CHIEF)).toBe(true);
      expect(hasPermission(ROLES.CHIEF, ROLES.DISPONENT)).toBe(true);
      expect(hasPermission(ROLES.CHIEF, ROLES.ANALYST)).toBe(true);
    });

    test("disponent has limited permissions", () => {
      expect(hasPermission(ROLES.DISPONENT, ROLES.ADMIN)).toBe(false);
      expect(hasPermission(ROLES.DISPONENT, ROLES.CHIEF)).toBe(false);
      expect(hasPermission(ROLES.DISPONENT, ROLES.DISPONENT)).toBe(true);
      expect(hasPermission(ROLES.DISPONENT, ROLES.ANALYST)).toBe(true);
    });

    test("analyst has minimal permissions", () => {
      expect(hasPermission(ROLES.ANALYST, ROLES.ADMIN)).toBe(false);
      expect(hasPermission(ROLES.ANALYST, ROLES.CHIEF)).toBe(false);
      expect(hasPermission(ROLES.ANALYST, ROLES.DISPONENT)).toBe(false);
      expect(hasPermission(ROLES.ANALYST, ROLES.ANALYST)).toBe(true);
    });

    test("handles invalid roles", () => {
      expect(hasPermission(null, ROLES.ADMIN)).toBe(false);
      expect(hasPermission(undefined, ROLES.ADMIN)).toBe(false);
      expect(hasPermission("invalid", ROLES.ADMIN)).toBe(false);
      expect(hasPermission(ROLES.ADMIN, null)).toBe(false);
    });
  });

  describe("Permissions", () => {
    test("canManageShifts permissions", () => {
      expect(Permissions.canManageShifts(ROLES.ADMIN)).toBe(true);
      expect(Permissions.canManageShifts(ROLES.CHIEF)).toBe(true);
      expect(Permissions.canManageShifts(ROLES.DISPONENT)).toBe(false);
      expect(Permissions.canManageShifts(ROLES.ANALYST)).toBe(false);
    });

    test("canViewAudit permissions", () => {
      expect(Permissions.canViewAudit(ROLES.ADMIN)).toBe(true);
      expect(Permissions.canViewAudit(ROLES.CHIEF)).toBe(false);
      expect(Permissions.canViewAudit(ROLES.DISPONENT)).toBe(false);
      expect(Permissions.canViewAudit(ROLES.ANALYST)).toBe(false);
    });

    test("canApplyForShifts permissions", () => {
      expect(Permissions.canApplyForShifts(ROLES.ADMIN)).toBe(true);
      expect(Permissions.canApplyForShifts(ROLES.CHIEF)).toBe(true);
      expect(Permissions.canApplyForShifts(ROLES.DISPONENT)).toBe(true);
      expect(Permissions.canApplyForShifts(ROLES.ANALYST)).toBe(false);
    });

    test("canViewAnalytics permissions", () => {
      expect(Permissions.canViewAnalytics(ROLES.ADMIN)).toBe(true);
      expect(Permissions.canViewAnalytics(ROLES.CHIEF)).toBe(true);
      expect(Permissions.canViewAnalytics(ROLES.DISPONENT)).toBe(true);
      expect(Permissions.canViewAnalytics(ROLES.ANALYST)).toBe(true);
    });

    test("canAssignShifts permissions", () => {
      expect(Permissions.canAssignShifts(ROLES.ADMIN)).toBe(true);
      expect(Permissions.canAssignShifts(ROLES.CHIEF)).toBe(true);
      expect(Permissions.canAssignShifts(ROLES.DISPONENT)).toBe(false);
      expect(Permissions.canAssignShifts(ROLES.ANALYST)).toBe(false);
    });

    test("canManageTemplates permissions", () => {
      expect(Permissions.canManageTemplates(ROLES.ADMIN)).toBe(true);
      expect(Permissions.canManageTemplates(ROLES.CHIEF)).toBe(true);
      expect(Permissions.canManageTemplates(ROLES.DISPONENT)).toBe(false);
      expect(Permissions.canManageTemplates(ROLES.ANALYST)).toBe(false);
    });
  });

  describe("extractUserRole", () => {
    test("extracts role from Authorization header", () => {
      const token = Buffer.from(JSON.stringify({ role: ROLES.ADMIN })).toString(
        "base64",
      );
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      expect(extractUserRole(req)).toBe(ROLES.ADMIN);
    });

    test("extracts role from session", () => {
      const req = {
        headers: {},
        session: {
          user: { role: ROLES.CHIEF },
        },
      };

      expect(extractUserRole(req)).toBe(ROLES.CHIEF);
    });

    test("extracts role from user object", () => {
      const req = {
        headers: {},
        user: { role: ROLES.DISPONENT },
      };

      expect(extractUserRole(req)).toBe(ROLES.DISPONENT);
    });

    test("returns null when no role found", () => {
      const req = { headers: {} };
      expect(extractUserRole(req)).toBe(null);
    });

    test("handles invalid Authorization header", () => {
      const req = {
        headers: {
          authorization: "Bearer invalid-token",
        },
      };

      expect(extractUserRole(req)).toBe(null);
    });
  });

  describe("requirePermission middleware", () => {
    let req, res, next;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    test("allows access with valid permission", () => {
      req.user = { role: ROLES.ADMIN };
      const middleware = requirePermission("canViewAudit");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userRole).toBe(ROLES.ADMIN);
    });

    test("denies access without authentication", () => {
      const middleware = requirePermission("canViewAudit");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "Authentication required",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("denies access with insufficient permission", () => {
      req.user = { role: ROLES.ANALYST };
      const middleware = requirePermission("canViewAudit");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Insufficient permissions. Required: canViewAudit",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("handles invalid permission key", () => {
      req.user = { role: ROLES.ADMIN };
      const middleware = requirePermission("invalidPermission");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal Error",
        message: "Invalid permission check",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireRole middleware", () => {
    let req, res, next;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    test("allows access with matching role", () => {
      req.user = { role: ROLES.ADMIN };
      const middleware = requireRole(ROLES.ADMIN);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userRole).toBe(ROLES.ADMIN);
    });

    test("allows access with role in array", () => {
      req.user = { role: ROLES.CHIEF };
      const middleware = requireRole([ROLES.ADMIN, ROLES.CHIEF]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userRole).toBe(ROLES.CHIEF);
    });

    test("denies access with wrong role", () => {
      req.user = { role: ROLES.ANALYST };
      const middleware = requireRole([ROLES.ADMIN, ROLES.CHIEF]);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Access denied. Required roles: admin, chief",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("guardResource middleware", () => {
    let req, res, next;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    test("allows shifts read for analyst", () => {
      req.user = { role: ROLES.ANALYST };
      const middleware = guardResource("shifts", "read");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("denies shifts write for analyst", () => {
      req.user = { role: ROLES.ANALYST };
      const middleware = guardResource("shifts", "write");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Access denied for write on shifts",
      });
    });

    test("allows audit read for admin", () => {
      req.user = { role: ROLES.ADMIN };
      const middleware = guardResource("audit", "read");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("denies audit read for non-admin", () => {
      req.user = { role: ROLES.CHIEF };
      const middleware = guardResource("audit", "read");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("denies access to unknown resource", () => {
      req.user = { role: ROLES.ADMIN };
      const middleware = guardResource("unknown", "read");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("getUserContext", () => {
    test("extracts user context from request", () => {
      const req = {
        headers: {},
        user: {
          role: ROLES.ADMIN,
          email: "admin@test.com",
        },
      };

      const context = getUserContext(req);

      expect(context).toEqual({
        actor: "admin@test.com",
        role: ROLES.ADMIN,
      });
    });

    test("handles anonymous user", () => {
      const req = { headers: {} };

      const context = getUserContext(req);

      expect(context).toEqual({
        actor: "Anonymous",
        role: "anonymous",
      });
    });

    test("falls back to unknown user", () => {
      const req = {
        headers: {},
        user: { role: ROLES.CHIEF },
      };

      const context = getUserContext(req);

      expect(context).toEqual({
        actor: "Unknown User",
        role: ROLES.CHIEF,
      });
    });
  });
});
