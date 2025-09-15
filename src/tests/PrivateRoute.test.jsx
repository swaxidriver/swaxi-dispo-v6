import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import { useAuth } from "../contexts/useAuth";

// Mock useAuth hook
jest.mock("../contexts/useAuth", () => ({
  useAuth: jest.fn(),
}));

describe("PrivateRoute", () => {
  const TestComponent = () => <div>Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders children when user is authenticated", () => {
    useAuth.mockReturnValue({
      user: { id: "admin", name: "Admin User", role: "admin" },
    });

    render(
      <MemoryRouter>
        <PrivateRoute>
          <TestComponent />
        </PrivateRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  test("redirects to login when user is not authenticated", () => {
    useAuth.mockReturnValue({
      user: null,
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <PrivateRoute>
          <TestComponent />
        </PrivateRoute>
      </MemoryRouter>
    );

    // Should not render protected content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    
    // Should render nothing (Navigate component doesn't render visible content in tests)
    expect(container.firstChild).toBeNull();
  });

  test("redirects to login when user exists but has no role", () => {
    useAuth.mockReturnValue({
      user: { id: "test", name: "Test User" }, // no role property
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <PrivateRoute>
          <TestComponent />
        </PrivateRoute>
      </MemoryRouter>
    );

    // Should not render protected content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    
    // Should render nothing (Navigate component doesn't render visible content in tests)
    expect(container.firstChild).toBeNull();
  });
});