import { useReducer, useEffect } from 'react';

import { ThemeContext } from './ThemeContextCore';

const prefersDark = () => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored === 'dark';
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

const initialState = { isDark: prefersDark() };

function themeReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { ...state, isDark: !state.isDark };
    default:
      return state;
  }
}

export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Apply theme to document
  useEffect(() => {
    const mode = state.isDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = mode;
    try { localStorage.setItem('theme', mode); } catch { /* ignore */ }
  }, [state.isDark]);

  return (
  <ThemeContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
}

