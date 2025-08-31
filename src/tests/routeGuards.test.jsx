import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ROLES } from '../utils/constants';
import AuthContext from '../contexts/AuthContext';
import {
  PermissionGuard,
  RoleGuard,
  PermissionCheck,
  RoleCheck,
  usePermission,
  useRole,
  useUserCapabilities
} from '../components/RouteGuards';

// Mock AuthContext
const mockUser = (role) => ({
  id: role,
  name: `${role} User`,
  role: role
});

const renderWithAuth = (component, user = null, initialEntry = '/') => {
  const authValue = {
    user,
    login: jest.fn(),
    logout: jest.fn(),
    mockUsers: {}
  };

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/protected" element={component} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('Route Guards', () => {
  describe('PermissionGuard', () => {
    test('redirects to login when not authenticated', () => {
      renderWithAuth(
        <PermissionGuard permission="canViewAnalytics">
          <div>Protected Content</div>
        </PermissionGuard>,
        null,
        '/protected'
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    test('renders content when user has permission', () => {
      renderWithAuth(
        <PermissionGuard permission="canViewAnalytics">
          <div>Protected Content</div>
        </PermissionGuard>,
        mockUser(ROLES.ADMIN),
        '/protected'
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('redirects when user lacks permission', () => {
      renderWithAuth(
        <PermissionGuard permission="canViewAudit">
          <div>Protected Content</div>
        </PermissionGuard>,
        mockUser(ROLES.ANALYST),
        '/protected'
      );

      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  describe('RoleGuard', () => {
    test('renders content for allowed single role', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={ROLES.ADMIN}>
          <div>Admin Content</div>
        </RoleGuard>,
        mockUser(ROLES.ADMIN),
        '/protected'
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    test('renders content for allowed role in array', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.CHIEF]}>
          <div>Management Content</div>
        </RoleGuard>,
        mockUser(ROLES.CHIEF),
        '/protected'
      );

      expect(screen.getByText('Management Content')).toBeInTheDocument();
    });

    test('redirects for disallowed role', () => {
      renderWithAuth(
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.CHIEF]}>
          <div>Management Content</div>
        </RoleGuard>,
        mockUser(ROLES.ANALYST),
        '/protected'
      );

      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  describe('PermissionCheck', () => {
    test('renders children when user has permission', () => {
      renderWithAuth(
        <PermissionCheck permission="canViewAnalytics">
          <div>Analytics Content</div>
        </PermissionCheck>,
        mockUser(ROLES.ADMIN)
      );

      expect(screen.getByText('Analytics Content')).toBeInTheDocument();
    });

    test('renders fallback when user lacks permission', () => {
      renderWithAuth(
        <PermissionCheck 
          permission="canManageShifts"
          fallback={<div>Access Denied</div>}
        >
          <div>Shift Management</div>
        </PermissionCheck>,
        mockUser(ROLES.ANALYST)
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Shift Management')).not.toBeInTheDocument();
    });

    test('renders nothing when no fallback provided', () => {
      const { container } = renderWithAuth(
        <PermissionCheck permission="canManageShifts">
          <div>Shift Management</div>
        </PermissionCheck>,
        mockUser(ROLES.ANALYST)
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('RoleCheck', () => {
    test('renders children for matching role', () => {
      renderWithAuth(
        <RoleCheck allowedRoles={ROLES.ADMIN}>
          <div>Admin Panel</div>
        </RoleCheck>,
        mockUser(ROLES.ADMIN)
      );

      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    test('renders fallback for non-matching role', () => {
      renderWithAuth(
        <RoleCheck 
          allowedRoles={ROLES.ADMIN}
          fallback={<div>Not Admin</div>}
        >
          <div>Admin Panel</div>
        </RoleCheck>,
        mockUser(ROLES.ANALYST)
      );

      expect(screen.getByText('Not Admin')).toBeInTheDocument();
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    });
  });

  describe('Hooks', () => {
    describe('usePermission', () => {
      const TestComponent = ({ permission }) => {
        const hasPermission = usePermission(permission);
        return <div>{hasPermission ? 'Has Permission' : 'No Permission'}</div>;
      };

      test('returns true when user has permission', () => {
        renderWithAuth(
          <TestComponent permission="canViewAnalytics" />,
          mockUser(ROLES.ADMIN)
        );

        expect(screen.getByText('Has Permission')).toBeInTheDocument();
      });

      test('returns false when user lacks permission', () => {
        renderWithAuth(
          <TestComponent permission="canViewAudit" />,
          mockUser(ROLES.ANALYST)
        );

        expect(screen.getByText('No Permission')).toBeInTheDocument();
      });
    });

    describe('useRole', () => {
      const TestComponent = ({ allowedRoles }) => {
        const hasRole = useRole(allowedRoles);
        return <div>{hasRole ? 'Has Role' : 'No Role'}</div>;
      };

      test('returns true for matching role', () => {
        renderWithAuth(
          <TestComponent allowedRoles={ROLES.ADMIN} />,
          mockUser(ROLES.ADMIN)
        );

        expect(screen.getByText('Has Role')).toBeInTheDocument();
      });

      test('returns false for non-matching role', () => {
        renderWithAuth(
          <TestComponent allowedRoles={ROLES.ADMIN} />,
          mockUser(ROLES.ANALYST)
        );

        expect(screen.getByText('No Role')).toBeInTheDocument();
      });

      test('returns true for role in array', () => {
        renderWithAuth(
          <TestComponent allowedRoles={[ROLES.ADMIN, ROLES.CHIEF]} />,
          mockUser(ROLES.CHIEF)
        );

        expect(screen.getByText('Has Role')).toBeInTheDocument();
      });
    });

    describe('useUserCapabilities', () => {
      const TestComponent = () => {
        const capabilities = useUserCapabilities();
        return (
          <div>
            <div data-testid="manage-shifts">{capabilities.canManageShifts.toString()}</div>
            <div data-testid="view-audit">{capabilities.canViewAudit.toString()}</div>
            <div data-testid="apply-shifts">{capabilities.canApplyForShifts.toString()}</div>
            <div data-testid="view-analytics">{capabilities.canViewAnalytics.toString()}</div>
            <div data-testid="assign-shifts">{capabilities.canAssignShifts.toString()}</div>
            <div data-testid="manage-templates">{capabilities.canManageTemplates.toString()}</div>
          </div>
        );
      };

      test('returns correct capabilities for admin', () => {
        renderWithAuth(<TestComponent />, mockUser(ROLES.ADMIN));

        expect(screen.getByTestId('manage-shifts')).toHaveTextContent('true');
        expect(screen.getByTestId('view-audit')).toHaveTextContent('true');
        expect(screen.getByTestId('apply-shifts')).toHaveTextContent('true');
        expect(screen.getByTestId('view-analytics')).toHaveTextContent('true');
        expect(screen.getByTestId('assign-shifts')).toHaveTextContent('true');
        expect(screen.getByTestId('manage-templates')).toHaveTextContent('true');
      });

      test('returns correct capabilities for chief', () => {
        renderWithAuth(<TestComponent />, mockUser(ROLES.CHIEF));

        expect(screen.getByTestId('manage-shifts')).toHaveTextContent('true');
        expect(screen.getByTestId('view-audit')).toHaveTextContent('false');
        expect(screen.getByTestId('apply-shifts')).toHaveTextContent('true');
        expect(screen.getByTestId('view-analytics')).toHaveTextContent('true');
        expect(screen.getByTestId('assign-shifts')).toHaveTextContent('true');
        expect(screen.getByTestId('manage-templates')).toHaveTextContent('true');
      });

      test('returns correct capabilities for disponent', () => {
        renderWithAuth(<TestComponent />, mockUser(ROLES.DISPONENT));

        expect(screen.getByTestId('manage-shifts')).toHaveTextContent('false');
        expect(screen.getByTestId('view-audit')).toHaveTextContent('false');
        expect(screen.getByTestId('apply-shifts')).toHaveTextContent('true');
        expect(screen.getByTestId('view-analytics')).toHaveTextContent('true');
        expect(screen.getByTestId('assign-shifts')).toHaveTextContent('false');
        expect(screen.getByTestId('manage-templates')).toHaveTextContent('false');
      });

      test('returns correct capabilities for analyst', () => {
        renderWithAuth(<TestComponent />, mockUser(ROLES.ANALYST));

        expect(screen.getByTestId('manage-shifts')).toHaveTextContent('false');
        expect(screen.getByTestId('view-audit')).toHaveTextContent('false');
        expect(screen.getByTestId('apply-shifts')).toHaveTextContent('false');
        expect(screen.getByTestId('view-analytics')).toHaveTextContent('true');
        expect(screen.getByTestId('assign-shifts')).toHaveTextContent('false');
        expect(screen.getByTestId('manage-templates')).toHaveTextContent('false');
      });

      test('returns all false for unauthenticated user', () => {
        renderWithAuth(<TestComponent />);

        expect(screen.getByTestId('manage-shifts')).toHaveTextContent('false');
        expect(screen.getByTestId('view-audit')).toHaveTextContent('false');
        expect(screen.getByTestId('apply-shifts')).toHaveTextContent('false');
        expect(screen.getByTestId('view-analytics')).toHaveTextContent('false');
        expect(screen.getByTestId('assign-shifts')).toHaveTextContent('false');
        expect(screen.getByTestId('manage-templates')).toHaveTextContent('false');
      });
    });
  });
});