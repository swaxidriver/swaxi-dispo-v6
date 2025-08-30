import { useState, useEffect, useRef, useCallback } from 'react';

// Lightweight env shim (avoids direct process reference for lint in browser context)
const __env = (typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env)
  ? globalThis.process.env
  : { NODE_ENV: 'development' };
import { useShifts } from '../contexts/useShifts';

// Build metadata injected by Vite define() (see vite.config.js)
/* global __APP_VERSION__ */
const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

export default function LiveVersionBanner() {
  const { state } = useShifts();
  const [isVisible, setIsVisible] = useState(true);
  const [buildInfo, setBuildInfo] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deployedVersion, setDeployedVersion] = useState(null);
  
  // Exponential backoff state
  const [failureCount, setFailureCount] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  const pollIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Function to check for version updates
  const checkForUpdates = useCallback(async () => {
    try {
      // Get version from meta tag in current document
      const metaTag = document.querySelector('meta[name="app-version"]');
      const currentDeployedVersion = metaTag?.content;
      
      if (currentDeployedVersion && currentDeployedVersion !== CURRENT_VERSION) {
        setDeployedVersion(currentDeployedVersion);
        setUpdateAvailable(true);
        // Reset failure count on success
        setFailureCount(0);
      } else {
        // Reset failure count on successful check (even if no update)
        setFailureCount(0);
      }
    } catch (error) {
      // Silent failure for offline mode - don't log to console
      // Increment failure count for exponential backoff
      setFailureCount(prev => prev + 1);
    }
  }, []);

  // Setup polling with exponential backoff
  useEffect(() => {
    if (!isPolling) return;

    const startPolling = () => {
      // Calculate delay with exponential backoff after 2 failures
      let delay = 60000; // 60 seconds base interval
      if (failureCount >= 2) {
        // Exponential backoff: 60s, 120s, 240s, max 480s (8 minutes)
        delay = Math.min(60000 * Math.pow(2, failureCount - 1), 480000);
      }

      timeoutRef.current = setTimeout(() => {
        checkForUpdates();
        startPolling(); // Schedule next check
      }, delay);
    };

    // Initial check
    checkForUpdates();
    
    // Start polling
    startPolling();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [checkForUpdates, failureCount, isPolling]);

  useEffect(() => {
    // Get build information
    const buildTime = new Date().toLocaleString('de-DE');
    const version = CURRENT_VERSION;
    // Use NODE_ENV for environment to keep Jest (CJS) compatibility instead of import.meta.env
    const environment = __env.NODE_ENV === 'production' ? 'production' : 'development';
    
    setBuildInfo({
      version,
      buildTime,
      environment,
      gitHash: 'latest', // Simplified for demo
      dataSource: state.dataSource?.source || 'localStorage'
    });
  }, [state.dataSource]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for session
    sessionStorage.setItem('bannerDismissed', 'true');
  };

  const handleReload = () => {
    // Hard refresh to get new version
    window.location.reload(true);
  };

  // Check if banner was previously dismissed
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('bannerDismissed');
    if (wasDismissed) {
      setIsVisible(false);
    }
  }, []);

  // Don't show if not visible or no build info
  if (!isVisible || !buildInfo) return null;

  // Show update banner if update is available
  if (updateAvailable) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto" data-testid="version-banner">
        <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 sm:px-3.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-x-2">
              <span className="text-sm font-medium text-white">
                🔄 Neue Version verfügbar – neu laden
              </span>
              {deployedVersion && (
                <span className="hidden sm:inline text-xs text-white/80">
                  (v{deployedVersion})
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-1 justify-end gap-x-2">
            <button
              type="button"
              onClick={handleReload}
              data-testid="version-reload-btn"
              className="rounded-md bg-white/20 px-3 py-1 text-sm font-medium text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Neu laden
            </button>
            <button
              type="button"
              onClick={() => setUpdateAvailable(false)}
              className="flex-none rounded-md bg-white/10 p-1 text-white/80 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Update-Benachrichtigung ausblenden"
            >
              <span className="sr-only">Update-Benachrichtigung ausblenden</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getDataSourceIcon = () => {
    switch (buildInfo.dataSource) {
      case 'sharePoint':
        return '☁️';
      case 'localStorage':
        return '💾';
      default:
        return '🔄';
    }
  };

  const getEnvironmentBadge = () => {
    if (buildInfo.environment === 'production') {
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
            {buildInfo.dataSource === 'sharePoint' ? 'SharePoint' : 'Demo Modus'}
          </span>
          
          <span className="hidden sm:block">
            Build: {buildInfo.buildTime}
          </span>
          
          {buildInfo.gitHash !== 'dev' && (
            <span className="hidden md:block font-mono text-xs">
              #{buildInfo.gitHash.substring(0, 7)}
            </span>
          )}
        </div>

        {buildInfo.environment === 'production' && buildInfo.dataSource === 'localStorage' && (
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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
