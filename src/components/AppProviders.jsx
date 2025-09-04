import { AuthProvider } from "../contexts/AuthContext";
import { ShiftProvider } from "../contexts/ShiftContext";
import { FeedbackProvider } from "../contexts/FeedbackContext";
import { I18nProvider } from "../contexts/I18nContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import { ThemeProvider } from "../contexts/ThemeContext";

/**
 * AppProviders component that wraps the application with all necessary context providers.
 * This follows the same nesting order as the original App.jsx to maintain compatibility.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The child components to wrap with providers
 */
function AppProviders({ children }) {
  return (
    <AuthProvider>
      <I18nProvider>
        <SettingsProvider>
          <ThemeProvider>
            <ShiftProvider>
              <FeedbackProvider
                onNewFeedback={(/** @type {any} */ entry) => {
                  // push into notifications via ShiftContext dispatch (available under provider tree)
                  // we cannot import hook at module top (ordering) so do dynamic inside callback
                  try {
                    const evt = new CustomEvent("swaxi-feedback", {
                      detail: entry,
                    });
                    window.dispatchEvent(evt);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                {children}
              </FeedbackProvider>
            </ShiftProvider>
          </ThemeProvider>
        </SettingsProvider>
      </I18nProvider>
    </AuthProvider>
  );
}

export default AppProviders;
