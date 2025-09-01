import { useRef, useCallback } from "react";

import { LiveRegion } from "../ui/accessibility";

import { useAsyncOperation } from "./index";

/**
 * Enhanced async operation hook with accessibility features
 * Provides loading states with proper ARIA announcements
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Configuration options
 * @returns {Object} - Enhanced async operation utilities with a11y support
 */
export function useAccessibleAsyncOperation(asyncFn, options = {}) {
  const {
    loadingMessage = "Lädt...",
    successMessage = "Erfolgreich abgeschlossen",
    errorMessage = "Ein Fehler ist aufgetreten",
    announceLoading = true,
    announceResults = true,
    ...asyncOptions
  } = options;

  const liveRegionRef = useRef(null);

  // Initialize live region for announcements
  if (!liveRegionRef.current && announceResults) {
    liveRegionRef.current = new LiveRegion("polite");
  }

  const announce = useCallback(
    (message) => {
      if (liveRegionRef.current && announceResults) {
        liveRegionRef.current.announce(message);
      }
    },
    [announceResults],
  );

  const baseAsync = useAsyncOperation(asyncFn, {
    ...asyncOptions,
    onSuccess: (result) => {
      announce(successMessage);
      asyncOptions.onSuccess?.(result);
    },
    onError: (error) => {
      const message = error?.message || errorMessage;
      announce(message);
      asyncOptions.onError?.(error);
    },
  });

  const executeWithAnnouncement = useCallback(
    async (...args) => {
      if (announceLoading) {
        announce(loadingMessage);
      }
      return baseAsync.execute(...args);
    },
    [announceLoading, announce, loadingMessage, baseAsync.execute],
  );

  const retryWithAnnouncement = useCallback(async () => {
    if (announceLoading) {
      announce("Erneut versuchen...");
    }
    return baseAsync.retry();
  }, [announceLoading, announce, baseAsync.retry]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.destroy();
      liveRegionRef.current = null;
    }
  }, []);

  return {
    ...baseAsync,
    execute: executeWithAnnouncement,
    retry: retryWithAnnouncement,
    announce,
    cleanup,
    // ARIA attributes for loading states
    getLoadingProps: () => ({
      "aria-busy": baseAsync.isLoading,
      "aria-live": "polite",
      "aria-relevant": "text",
    }),
    // Helper for disabled state
    getDisabledProps: () => ({
      disabled: baseAsync.isLoading,
      "aria-disabled": baseAsync.isLoading,
    }),
  };
}

/**
 * Hook for managing loading states with visual and screen reader feedback
 * @param {string} loadingText - Text to display/announce during loading
 * @returns {Object} - Loading state utilities
 */
export function useLoadingState(loadingText = "Lädt...") {
  const liveRegionRef = useRef(null);

  if (!liveRegionRef.current) {
    liveRegionRef.current = new LiveRegion("polite");
  }

  const announceLoading = useCallback(
    (isLoading, customText) => {
      const text = isLoading ? customText || loadingText : "";
      if (liveRegionRef.current) {
        liveRegionRef.current.announce(text);
      }
    },
    [loadingText],
  );

  const getAriaProps = useCallback(
    (isLoading) => ({
      "aria-busy": isLoading,
      "aria-live": "polite",
    }),
    [],
  );

  const cleanup = useCallback(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.destroy();
      liveRegionRef.current = null;
    }
  }, []);

  return {
    announceLoading,
    getAriaProps,
    cleanup,
  };
}

export default {
  useAccessibleAsyncOperation,
  useLoadingState,
};
