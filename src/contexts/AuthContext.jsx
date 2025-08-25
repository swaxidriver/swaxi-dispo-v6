import { createContext, useContext, useReducer, useEffect } from 'react';
import { ROLES } from '../utils/constants';

const AuthContext = createContext();

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  role: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        currentUser: action.payload.user,
        isAuthenticated: true,
        role: action.payload.role
      };
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
        role: null
      };
    case 'UPDATE_ROLE':
      return {
        ...state,
        role: action.payload
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load auth state from localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem('swaxi-auth');
    if (savedAuth) {
      const { user, role } = JSON.parse(savedAuth);
      dispatch({
        type: 'LOGIN',
        payload: { user, role }
      });
    }
  }, []);

  // Save auth state to localStorage
  useEffect(() => {
    if (state.isAuthenticated) {
      localStorage.setItem('swaxi-auth', JSON.stringify({
        user: state.currentUser,
        role: state.role
      }));
    } else {
      localStorage.removeItem('swaxi-auth');
    }
  }, [state]);

  const login = (username, role = ROLES.DISPONENT) => {
    dispatch({
      type: 'LOGIN',
      payload: {
        user: { username },
        role
      }
    });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateRole = (newRole) => {
    dispatch({
      type: 'UPDATE_ROLE',
      payload: newRole
    });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
