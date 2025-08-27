import { useState, useEffect } from "react";

// Lightweight env shim (avoids direct process reference for lint in browser context)
const __env =
  typeof globalThis !== "undefined" &&
  globalThis.process &&
  globalThis.process.env
    ? globalThis.process.env
    : { NODE_ENV: "development" };
import { useShifts } from "../contexts/useShifts";

export default function LiveVersionBanner() {
  const { state } = useShifts();
  const [isVisible, setIsVisible] = useState(true);
  const [buildInfo, setBuildInfo] = useState(null);

  useEffect(() => {
    // Get build information
    const buildTime = new Date().toLocaleString("de-DE");
    const version = "6.0.0"; // Static version for now
    // Use NODE_ENV for environment to keep Jest (CJS) compatibility instead of import.meta.env
    const environment =
      __env.NODE_ENV === "production" ? "production" : "development";

    setBuildInfo({
      version,
      buildTime,
      environment,
      gitHash: "latest", // Simplified for demo
      dataSource: state.dataSource?.source || "localStorage",
    });
  }, [state.dataSource]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for session
    sessionStorage.setItem("bannerDismissed", "true");
  };

  // Check if banner was previously dismissed
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("bannerDismissed");
    if (wasDismissed) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible || !buildInfo) return null;

  const getDataSourceIcon = () => {
    switch (buildInfo.dataSource) {
      case "sharePoint":
        return "☁️";
      case "localStorage":
        return "💾";
      default:
        return "🔄";
    }
  };

  const getEnvironmentBadge = () => {
    if (buildInfo.environment === "production") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          🚀 Live
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        🧪 Demo
      </span>
    );
  };

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-x-2">
          {getEnvironmentBadge()}
          <span className="text-sm font-semibold text-white">
            Swaxi Dispo v{buildInfo.version}
          </span>
        </div>

        <div className="flex items-center gap-x-4 text-sm text-white/90">
          <span className="flex items-center gap-x-1">
            {getDataSourceIcon()}
            {buildInfo.dataSource === "sharePoint"
              ? "SharePoint"
              : "Demo Modus"}
          </span>

          <span className="hidden sm:block">Build: {buildInfo.buildTime}</span>

          {buildInfo.gitHash !== "dev" && (
            <span className="hidden md:block font-mono text-xs">
              #{buildInfo.gitHash.substring(0, 7)}
            </span>
          )}
        </div>

        {buildInfo.environment === "production" &&
          buildInfo.dataSource === "localStorage" && (
            <div className="flex items-center gap-x-2 text-sm text-orange-200">
              <span className="animate-pulse">⚠️</span>
              <span>Offline Modus - Daten werden lokal gespeichert</span>
            </div>
          )}
      </div>

      <div className="flex flex-1 justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-none rounded-md bg-white/10 p-1 text-white/80 hover:bg-white/20 hover:text-white"
          aria-label="Banner schließen"
        >
          <span className="sr-only">Banner schließen</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
