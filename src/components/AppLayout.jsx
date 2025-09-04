import { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import Navigation from "./Navigation";
import LiveVersionBanner from "./LiveVersionBanner";
import AutosaveManager from "./AutosaveManager";
import FeedbackModal from "./FeedbackModal";
import ChangelogModal from "./ChangelogModal";
import ErrorBoundary from "./ErrorBoundary";
import AppRoutes from "./AppRoutes";

// Build metadata injected by Vite define() (see vite.config.js)
/* global __APP_VERSION__, __APP_COMMIT__ */
const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
const APP_COMMIT =
  typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "local";

/**
 * Footer component for the application.
 *
 * @param {{ onOpenChangelog: () => void }} props
 */
function Footer({ onOpenChangelog }) {
  return (
    <footer
      className="mt-auto py-4 text-center text-sm text-gray-500 mobile-safe-bottom"
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

/**
 * AppLayout component that provides the main application layout structure.
 * Handles the router, navigation, main content area, footer, and modals.
 *
 * @param {Object} props
 * @param {boolean} props.ready - Whether the app is ready to render content
 */
function AppLayout({ ready }) {
  const [changelogOpen, setChangelogOpen] = useState(false);

  return (
    <Router basename="/swaxi-dispo-v6">
      <div className="min-h-screen-dynamic bg-bg text-text flex flex-col mobile-safe-container">
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
            <AppRoutes ready={ready} />
          </main>
        </ErrorBoundary>
        <Footer onOpenChangelog={() => setChangelogOpen(true)} />
        <AutosaveManager />

        {/* Global polite aria-live region for lightweight announcements / toasts */}
        <div id="aria-live-root" className="sr-only" aria-live="polite" />

        <FeedbackModal />
        <ChangelogModal
          isOpen={changelogOpen}
          onClose={() => setChangelogOpen(false)}
        />
      </div>
    </Router>
  );
}

export default AppLayout;
