import { useState, useEffect } from "react";

/**
 * Hook to detect mobile devices using CSS media query (hover: none)
 * This is more reliable than user agent detection for touch-first devices
 * @returns {boolean} true if device is mobile/touch-first
 */
export function useMobileDevice() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device supports hover (desktop) or not (mobile/touch)
    const mediaQuery = window.matchMedia("(hover: none)");

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes (e.g., when connecting/disconnecting external mouse)
    const handleChange = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

/**
 * Get time input step value based on device type
 * @returns {string} "60" for mobile (1 minute), "900" for desktop (15 minutes)
 */
export function useTimeInputStep() {
  const isMobile = useMobileDevice();
  return isMobile ? "60" : "900";
}
