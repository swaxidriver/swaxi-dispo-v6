// Central feature flag accessors (kept tiny). Vite inlines import.meta.env.* at build.
import { getEnv } from "./env";

// Get validated environment configuration
const env = getEnv();

export const ENABLE_SHAREPOINT =
  String(env.VITE_ENABLE_SHAREPOINT).toLowerCase() === "true";

export function describeFlags() {
  return { ENABLE_SHAREPOINT };
}

export default { ENABLE_SHAREPOINT };
