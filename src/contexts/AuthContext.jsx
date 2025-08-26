import { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export default AuthContext; // internal export consumed by useAuth.js

// Use lowercase internal role keys matching constants
// Add stable id field so features (applications, assignments) can reference a user consistently.
const mockUsers = {
  admin: { id: 'admin', name: 'Admin User', role: 'admin' },
  chief: { id: 'chief', name: 'Chief Dispatcher', role: 'chief' },
  disponent: { id: 'disponent', name: 'Dispatcher', role: 'disponent' },
  analyst: { id: 'analyst', name: 'Analyst', role: 'analyst' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (roleKey) => {
    const userToLogin = mockUsers[roleKey];
    if (userToLogin) {
      setUser(userToLogin);
      localStorage.setItem('user', JSON.stringify(userToLogin));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Migrate legacy capitalized role values
        const lower = parsed.role?.toLowerCase();
        if (lower && lower !== parsed.role) {
          parsed.role = lower;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
        // Backfill id if missing using role key (non-persistent legacy sessions)
        if (!parsed.id && parsed.role) {
          parsed.id = parsed.role;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
        setUser(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, mockUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook moved to useAuth.js to satisfy fast refresh rules
