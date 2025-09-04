import { createContext, useReducer, useEffect } from "react";

import { useLocalStorage } from "../hooks";

const SettingsContext = createContext();

const initialState = {
  theme: "system", // Light/Dark/System
  role: "disponent", // Demo role for role-gated UI testing
  timeFormat: "24h", // 24h or ampm
  conflictRulesEnabled: true,
  autosaveInterval: 30, // seconds: 15, 30, or 60
  notificationsEnabled: true, // Enable/disable notifications
  // Experimental features
  dragDropEnabled: true, // Enable drag-and-drop functionality
  autoAssignEnabled: false, // Enable automatic assignment features
};

function settingsReducer(state, action) {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_ROLE":
      return { ...state, role: action.payload };
    case "SET_TIME_FORMAT":
      return { ...state, timeFormat: action.payload };
    case "SET_CONFLICT_RULES":
      return { ...state, conflictRulesEnabled: action.payload };
    case "SET_AUTOSAVE_INTERVAL":
      return { ...state, autosaveInterval: action.payload };
    case "SET_NOTIFICATIONS":
      return { ...state, notificationsEnabled: action.payload };
    case "SET_DRAG_DROP":
      return { ...state, dragDropEnabled: action.payload };
    case "SET_AUTO_ASSIGN":
      return { ...state, autoAssignEnabled: action.payload };
    case "RESET_SETTINGS":
      return { ...initialState };
    case "LOAD_SETTINGS":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function SettingsProvider({ children }) {
  const [storedSettings, setStoredSettings] = useLocalStorage(
    "swaxi.settings.preferences",
    initialState,
  );
  const [state, dispatch] = useReducer(
    settingsReducer,
    storedSettings || initialState,
  );

  // Save settings to localStorage whenever they change
  useEffect(() => {
    setStoredSettings(state);
  }, [state, setStoredSettings]);

  const updateSetting = (key, value) => {
    switch (key) {
      case "theme":
        dispatch({ type: "SET_THEME", payload: value });
        break;
      case "role":
        dispatch({ type: "SET_ROLE", payload: value });
        break;
      case "timeFormat":
        dispatch({ type: "SET_TIME_FORMAT", payload: value });
        break;
      case "conflictRulesEnabled":
        dispatch({ type: "SET_CONFLICT_RULES", payload: value });
        break;
      case "autosaveInterval":
        dispatch({ type: "SET_AUTOSAVE_INTERVAL", payload: value });
        break;
      case "notificationsEnabled":
        dispatch({ type: "SET_NOTIFICATIONS", payload: value });
        break;
      case "dragDropEnabled":
        dispatch({ type: "SET_DRAG_DROP", payload: value });
        break;
      case "autoAssignEnabled":
        dispatch({ type: "SET_AUTO_ASSIGN", payload: value });
        break;
      default:
        console.warn(`Unknown setting key: ${key}`);
    }
  };

  const resetSettings = () => {
    dispatch({ type: "RESET_SETTINGS" });
  };

  const exportSettings = () => {
    const data = {
      settings: state,
      timestamp: new Date().toISOString(),
      version: "0.3.0",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swaxi-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const value = {
    settings: state,
    updateSetting,
    resetSettings,
    exportSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export { SettingsContext };
