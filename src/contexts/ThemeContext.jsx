import { useReducer, useEffect } from "react";

import { ThemeContext } from "./ThemeContextCore";

const getSystemPreference = () => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
};

const getThemeMode = () => {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  }
  return "system"; // Default to system preference
};

const getEffectiveTheme = (mode) => {
  if (mode === "system") {
    return getSystemPreference();
  }
  return mode === "dark";
};

const initialState = {
  mode: getThemeMode(),
  isDark: getEffectiveTheme(getThemeMode()),
};

function themeReducer(state, action) {
  switch (action.type) {
    case "SET_THEME_MODE": {
      const mode = action.payload;
      return {
        ...state,
        mode,
        isDark: getEffectiveTheme(mode),
      };
    }
    case "TOGGLE_THEME": {
      // Legacy support - toggles between light and dark (not system)
      const newMode = state.isDark ? "light" : "dark";
      return {
        ...state,
        mode: newMode,
        isDark: !state.isDark,
      };
    }
    case "UPDATE_SYSTEM_PREFERENCE":
      // Update isDark if in system mode
      if (state.mode === "system") {
        return { ...state, isDark: action.payload };
      }
      return state;
    default:
      return state;
  }
}

export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e) => {
        dispatch({ type: "UPDATE_SYSTEM_PREFERENCE", payload: e.matches });
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const mode = state.isDark ? "dark" : "light";
    document.documentElement.dataset.theme = mode;

    // Only store explicit theme choices, not system-derived values
    if (state.mode !== "system") {
      try {
        localStorage.setItem("theme", state.mode);
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.setItem("theme", "system");
      } catch {
        /* ignore */
      }
    }
  }, [state.isDark, state.mode]);

  const setThemeMode = (mode) => {
    dispatch({ type: "SET_THEME_MODE", payload: mode });
  };

  return (
    <ThemeContext.Provider value={{ state, dispatch, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
