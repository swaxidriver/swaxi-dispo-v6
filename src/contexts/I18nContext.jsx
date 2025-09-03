import { createContext, useReducer, useEffect } from "react";

import { useLocalStorage } from "../hooks";
import { dictionary } from "../i18n";

const I18nContext = createContext();

const initialState = {
  language: "de", // Default to German as specified
  dictionary,
};

function i18nReducer(state, action) {
  switch (action.type) {
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    default:
      return state;
  }
}

export function I18nProvider({ children }) {
  const [storedLanguage, setStoredLanguage] = useLocalStorage(
    "swaxi.settings.language",
    "de",
  );
  const [state, dispatch] = useReducer(i18nReducer, {
    ...initialState,
    language: storedLanguage,
  });

  // Save language changes to localStorage (only when language changes)
  useEffect(() => {
    setStoredLanguage(state.language);
  }, [state.language, setStoredLanguage]);

  const setLanguage = (language) => {
    dispatch({ type: "SET_LANGUAGE", payload: language });
  };

  // Translation helper function - returns German translation if current language missing, then key as last fallback
  const t = (key) => {
    const translation = state.dictionary[state.language]?.[key];
    if (translation) {
      return translation;
    }

    // Fallback to German if not found in current language (except if current language is already German)
    if (state.language !== "de") {
      const fallbackTranslation = state.dictionary.de?.[key];
      if (fallbackTranslation) {
        return fallbackTranslation;
      }
    }

    // Final fallback: return key if no translation found
    return key;
  };

  const value = {
    language: state.language,
    setLanguage,
    t,
    availableLanguages: Object.keys(state.dictionary),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { I18nContext };
