/**
 * Error boundaries utilities
 * Provides enhanced error handling with diagnostics, error IDs, and server logging
 */

import { v4 as uuidv4 } from "uuid";

import { logError } from "../utils/logger";

/**
 * Generate a unique error ID for tracking
 * @returns {string} Error ID in format "ERR-XXXXXXXX"
 */
export function generateErrorId() {
  const shortId = uuidv4().split("-")[0].toUpperCase();
  return `ERR-${shortId}`;
}

/**
 * Create enhanced error payload with diagnostics
 * @param {Error} error - The error object
 * @param {Object} info - React error info (componentStack, etc.)
 * @param {string} errorId - Unique error identifier
 * @returns {Object} Enhanced error payload
 */
export function createErrorPayload(error, info, errorId) {
  return {
    errorId,
    message: error?.message || String(error),
    stack: error?.stack,
    componentStack: info?.componentStack,
    timestamp: new Date().toISOString(),
    version: "6.0.1",
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    url: typeof window !== "undefined" ? window.location.href : "unknown",
  };
}

/**
 * Copy error diagnostics to clipboard
 * @param {Object} errorPayload - Error payload to copy
 * @returns {Promise<boolean>} True if successfully copied
 */
export async function copyErrorDiagnostics(errorPayload) {
  if (!navigator.clipboard) {
    return false;
  }

  const diagnostics = `Error ID: ${errorPayload.errorId}
Timestamp: ${errorPayload.timestamp}
Message: ${errorPayload.message}
Version: ${errorPayload.version}
URL: ${errorPayload.url}
User Agent: ${errorPayload.userAgent}

Stack Trace:
${errorPayload.stack || "No stack trace available"}

Component Stack:
${errorPayload.componentStack || "No component stack available"}`;

  try {
    await navigator.clipboard.writeText(diagnostics);
    return true;
  } catch (err) {
    logError("Failed to copy error diagnostics to clipboard:", err);
    return false;
  }
}

/**
 * Send error to server for logging
 * @param {Object} errorPayload - Error payload to send
 * @returns {Promise<boolean>} True if successfully sent
 */
export async function sendErrorToServer(errorPayload) {
  try {
    const response = await fetch("/api/errors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorPayload),
    });

    return response.ok;
  } catch (err) {
    logError("Failed to send error to server:", err);
    return false;
  }
}

/**
 * Register error telemetry handler that sends errors to server
 * Call this once during app initialization
 */
export function registerServerErrorTelemetry() {
  // Import here to avoid circular dependency
  import("../utils/errorTelemetry")
    .then(({ registerErrorTelemetry }) => {
      registerErrorTelemetry(async (payload) => {
        await sendErrorToServer(payload);
      });
    })
    .catch((err) => {
      logError("Failed to register server error telemetry:", err);
    });
}

export default {
  generateErrorId,
  createErrorPayload,
  copyErrorDiagnostics,
  sendErrorToServer,
  registerServerErrorTelemetry,
};
