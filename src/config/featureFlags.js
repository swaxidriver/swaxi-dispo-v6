// Central feature flag accessors (kept tiny). Vite inlines import.meta.env.* at build.
/* global process */

// Global flag to track if we're in test environment
const isTestEnvironment =
  typeof process !== "undefined" &&
  process.env &&
  process.env.NODE_ENV === "test";

function readEnv(name, fallback) {
  // In test environment, only use process.env to avoid import.meta parsing issues
  if (isTestEnvironment) {
    return process.env[name] || fallback;
  }

  // In browser/Vite environment, use import.meta.env or process.env
  // Use eval to prevent Jest from parsing import.meta at module load time
  try {
    const importMeta = eval(
      'typeof import !== "undefined" ? import.meta : undefined',
    );
    if (importMeta && importMeta.env && name in importMeta.env)
      return importMeta.env[name];
  } catch (_e) {
    // Fallback to process.env if import.meta fails
  }

  if (typeof process !== "undefined" && process.env && name in process.env)
    return process.env[name];
  return fallback;
}

export const ENABLE_SHAREPOINT =
  String(readEnv("VITE_ENABLE_SHAREPOINT", "false")).toLowerCase() === "true";

export function describeFlags() {
  return { ENABLE_SHAREPOINT };
}

export default { ENABLE_SHAREPOINT };
