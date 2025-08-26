import { useReducer, useEffect } from 'react';

import { ThemeContext } from './ThemeContextCore';

const initialState = {
  isDark: false,
  colors: {
    primary: '#222F88',
    accent: '#27ADE7',
    background: '#f6f7fb',
    surface: '#ffffff',
    text: '#0f172a'
  }
};

function themeReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return {
        ...state,
        isDark: !state.isDark,
        colors: state.isDark ? {
          primary: '#222F88',
          accent: '#27ADE7',
          background: '#f6f7fb',
          surface: '#ffffff',
          text: '#0f172a'
        } : {
          primary: '#222F88',
          accent: '#27ADE7',
          background: '#060918',
          surface: '#0b1022',
          text: '#e5e7eb'
        }
      };
    default:
      return state;
  }
}

export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.dataset.theme = state.isDark ? 'dark' : 'light';
  }, [state.isDark]);

  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
}

