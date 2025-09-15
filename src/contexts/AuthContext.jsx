import { createContext, useState, useEffect } from "react";

const AuthContext = createContext();
export default AuthContext; // internal export consumed by useAuth.js

// Helper function to get base URL safely in both browser and test environments
const getBaseUrl = () => {
  // In tests, just return "/"
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
    return "/";
  }
  // In browser with Vite, this should be injected as a global
  if (typeof window !== "undefined" && window.__VITE_BASE_URL__) {
    return window.__VITE_BASE_URL__;
  }
  // Fallback for browser environments
  return "/swaxi-dispo-v6/";
};

/**
 * User role type definition
 * @typedef {'admin' | 'chief' | 'disponent' | 'analyst' | null} UserRole
 */

// Use lowercase internal role keys matching constants
// Add stable id field so features (applications, assignments) can reference a user consistently.
const mockUsers = {
  admin: { id: "admin", name: "Admin User", role: "admin" },
  chief: { id: "chief", name: "Chief Dispatcher", role: "chief" },
  disponent: { id: "disponent", name: "Dispatcher", role: "disponent" },
  analyst: { id: "analyst", name: "Analyst", role: "analyst" },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  /**
   * Login with a specific role and redirect to app root
   * @param {UserRole} role - The role to login as
   */
  const login = (roleKey) => {
    const userToLogin = mockUsers[roleKey];
    if (userToLogin) {
      setUser(userToLogin);
      // Persist both keys for backward compatibility
      localStorage.setItem("user", JSON.stringify(userToLogin));
      localStorage.setItem("swaxi.role", userToLogin.role);
      
      // Redirect to app root after login (skip in test environment)
      if (typeof window !== "undefined" && !window.location.pathname.includes("/test")) {
        const base = getBaseUrl();
        window.location.assign(base);
      }
    }
  };

  /**
   * Logout and redirect to login page
   */
  const logout = () => {
    setUser(null);
    // Clear both storage keys
    localStorage.removeItem("user");
    localStorage.removeItem("swaxi.role");
    
    // Redirect to login page after logout (skip in test environment)
    if (typeof window !== "undefined" && !window.location.pathname.includes("/test")) {
      const base = getBaseUrl();
      window.location.assign(`${base}login`);
    }
  };

  useEffect(() => {
    // Prefer full "user" object, else read "swaxi.role" and reconstruct from mockUsers
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("swaxi.role");
    
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Migrate legacy capitalized role values
        const lower = parsed.role?.toLowerCase();
        if (lower && lower !== parsed.role) {
          parsed.role = lower;
          localStorage.setItem("user", JSON.stringify(parsed));
          localStorage.setItem("swaxi.role", lower);
        }
        // Backfill id if missing using role key (non-persistent legacy sessions)
        if (!parsed.id && parsed.role) {
          parsed.id = parsed.role;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
        // Ensure swaxi.role is in sync
        if (parsed.role && localStorage.getItem("swaxi.role") !== parsed.role) {
          localStorage.setItem("swaxi.role", parsed.role);
        }
        setUser(parsed);
      } catch {
        /* ignore */
      }
    } else if (storedRole && mockUsers[storedRole]) {
      // Reconstruct user from role and mockUsers
      const reconstructedUser = mockUsers[storedRole];
      setUser(reconstructedUser);
      localStorage.setItem("user", JSON.stringify(reconstructedUser));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, mockUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook moved to useAuth.js to satisfy fast refresh rules
