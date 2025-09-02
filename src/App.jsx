/* eslint-disable import/order */
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { ShiftProvider } from "./contexts/ShiftContext";
import { FeedbackProvider } from "./contexts/FeedbackContext";
import { I18nProvider } from "./contexts/I18nContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import FeedbackModal from "./components/FeedbackModal";
import ChangelogModal from "./components/ChangelogModal";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navigation from "./components/Navigation";
import LiveVersionBanner from "./components/LiveVersionBanner";
import AutosaveManager from "./components/AutosaveManager";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Administration from "./pages/Administration";
import Audit from "./pages/Audit";
import Settings from "./pages/Settings";
import TestPage from "./pages/TestPage";
import ShiftDesigner from "./pages/ShiftDesigner";
import PersonalApplications from "./pages/PersonalApplications";
import { Login } from "./features/people";
import "./App.css";

import ErrorBoundary from "./components/ErrorBoundary";
import { registerServerErrorTelemetry } from "./ui/error-boundaries";
import { validateEnv } from "./config/env";

// Register server error telemetry once during app initialization
registerServerErrorTelemetry();

// Validate environment configuration early - fail fast on invalid config
try {
  validateEnv({ strict: true });
} catch (error) {
  console.error("❌ Environment validation failed:", error.message);
  console.error("Please check your .env file against .env.example");
  throw error;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-6 bg-gray-300 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  );
}

// Build metadata injected by Vite define() (see vite.config.js)
/* global __APP_VERSION__, __APP_COMMIT__ */
const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
const APP_COMMIT =
  typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "local";

/**
 * @param {{ onOpenChangelog: () => void }} props
 */
function Footer({ onOpenChangelog }) {
  return (
    <footer
      className="mt-auto py-4 text-center text-sm text-gray-500 safe-bottom safe-x"
      role="contentinfo"
      aria-label="Seiteninformationen"
    >
      <p>
        swaxi Dispo v{APP_VERSION} ({APP_COMMIT}) • {new Date().getFullYear()}
        {" • "}
        <button
          onClick={onOpenChangelog}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline focus-ring-primary"
          aria-describedby="changelog-hint"
        >
          Änderungsprotokoll
        </button>
        <span id="changelog-hint" className="sr-only">
          Öffnet ein Dialog mit den neuesten Änderungen der Anwendung
        </span>
      </p>
    </footer>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  useEffect(() => {
    // minimal defer to allow ShiftProvider bootstrap; could watch context instead
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);
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
                <Router basename="/swaxi-dispo-v6">
                  <div className="min-h-screen bg-bg text-text flex flex-col">
                    {/* Global live region for application-wide announcements */}
                    <div
                      id="global-live-region"
                      aria-live="polite"
                      aria-atomic="true"
                      className="sr-only"
                    ></div>

                    <LiveVersionBanner />
                    <Navigation />
                    <ErrorBoundary>
                      <main
                        id="main-content"
                        className="flex-1"
                        role="main"
                        aria-label="Hauptinhalt"
                      >
                        {ready ? (
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route
                              path="/applications"
                              element={<PersonalApplications />}
                            />
                            <Route path="/admin" element={<Administration />} />
                            <Route
                              path="/shift-designer"
                              element={<ShiftDesigner />}
                            />
                            <Route path="/audit" element={<Audit />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/test" element={<TestPage />} />
                            <Route path="/login" element={<Login />} />
                          </Routes>
                        ) : (
                          <div
                            role="status"
                            aria-live="polite"
                            aria-label="Anwendung wird geladen"
                          >
                            <LoadingSkeleton />
                            <span className="sr-only">
                              Anwendung wird geladen, bitte warten...
                            </span>
                          </div>
                        )}
                      </main>
                    </ErrorBoundary>
                    <Footer onOpenChangelog={() => setChangelogOpen(true)} />
                    <AutosaveManager />
                    {/* Global polite aria-live region for lightweight announcements / toasts */}
                    <div
                      id="aria-live-root"
                      className="sr-only"
                      aria-live="polite"
                    />
                    <FeedbackModal />
                    <ChangelogModal
                      isOpen={changelogOpen}
                      onClose={() => setChangelogOpen(false)}
                    />
                  </div>
                </Router>
              </FeedbackProvider>
            </ShiftProvider>
          </ThemeProvider>
        </SettingsProvider>
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;
