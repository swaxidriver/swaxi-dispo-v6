// Environment variable validation with runtime schema checking
/* global process */
import { z } from "zod";

// Environment schema definition
const envSchema = z.object({
  // Core feature flags
  VITE_ENABLE_SHAREPOINT: z.string().default("false"),

  // Backend configuration
  VITE_SHIFT_BACKEND: z
    .enum(["memory", "indexeddb", "idx", "sharepoint"])
    .default("memory"),

  // Environment type
  VITE_ENVIRONMENT: z
    .enum(["development", "staging", "production"])
    .default("development"),

  // Firebase configuration (optional for now since Firebase is stubbed)
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),

  // Development settings
  VITE_USE_FIREBASE_EMULATOR: z.string().default("false"),
  VITE_FIREBASE_EMULATOR_HOST: z.string().default("localhost"),
  VITE_FIREBASE_EMULATOR_PORT: z.string().default("8080"),
});

// Cache environment check for performance
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
  // Use dynamic property access to prevent Jest from parsing import.meta at module load time
  try {
    const getImportMeta = new Function(
      'return typeof import !== "undefined" ? import.meta : undefined',
    );
    const importMeta = getImportMeta();
    if (importMeta && importMeta.env && name in importMeta.env)
      return importMeta.env[name];
  } catch (_e) {
    // Fallback to process.env if import.meta fails
  }

  if (typeof process !== "undefined" && process.env && name in process.env)
    return process.env[name];
  return fallback;
}

// Build raw environment object
function getRawEnv() {
  const raw = {};
  const schemaKeys = Object.keys(envSchema.shape);

  for (const key of schemaKeys) {
    const value = readEnv(key, undefined);
    if (value !== undefined) {
      raw[key] = value;
    }
  }

  return raw;
}

let cachedEnv = null;

/**
 * Validate and return environment configuration
 * @param {Object} options - Validation options
 * @param {boolean} options.strict - If true, throws on validation errors. If false, logs warnings and uses defaults.
 * @returns {Object} Validated environment configuration
 */
export function validateEnv(options = {}) {
  if (cachedEnv) return cachedEnv;

  const { strict = true } = options;
  const rawEnv = getRawEnv();

  try {
    cachedEnv = envSchema.parse(rawEnv);
    return cachedEnv;
  } catch (error) {
    const errorMessage = `Environment validation failed: ${error.message}`;

    if (strict) {
      throw new Error(errorMessage);
    } else {
      console.warn(errorMessage);
      console.warn(
        "Using default values for missing/invalid environment variables",
      );
      // Parse with defaults
      cachedEnv = envSchema.parse({});
      return cachedEnv;
    }
  }
}

/**
 * Get validated environment variables (cached)
 * @returns {Object} Validated environment configuration
 */
export function getEnv() {
  return cachedEnv || validateEnv();
}

/**
 * Reset environment cache (mainly for testing)
 */
export function resetEnvCache() {
  cachedEnv = null;
}

// Export schema for testing
export { envSchema };
