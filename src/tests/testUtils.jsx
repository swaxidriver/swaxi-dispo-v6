import { render, screen, fireEvent, act, within } from "@testing-library/react";

import AuthContext from "../contexts/AuthContext";
import { ShiftProvider } from "../contexts/ShiftContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { I18nProvider } from "../contexts/I18nContext";
import { SettingsProvider } from "../contexts/SettingsContext";

/**
 * Unified test render with common providers.
 * Options:
 *  - authUser: { name, role }
 *  - shiftOverrides: function to run after initial render for additional state tweaks (receives window.localStorage or dispatch via custom TODO)
 */
export function renderWithProviders(
  ui,
  {
    authUser = { name: "Tester", role: "admin" },
    providerProps = {},
    ...renderOptions
  } = {},
) {
  return render(
    <AuthContext.Provider value={{ user: authUser }}>
      <I18nProvider>
        <SettingsProvider>
          <ThemeProvider>
            <ShiftProvider {...providerProps}>{ui}</ShiftProvider>
          </ThemeProvider>
        </SettingsProvider>
      </I18nProvider>
    </AuthContext.Provider>,
    renderOptions,
  );
}

// Re-export RTL helpers for convenience
export { render, screen, fireEvent, act, within };
