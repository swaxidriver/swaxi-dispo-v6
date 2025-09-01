import { ENABLE_SHAREPOINT } from "../config/featureFlags";
import { getEnv } from "../config/env";
import { logInfo } from "../utils/logger";

import { InMemoryShiftRepository } from "./InMemoryShiftRepository";
import { SharePointShiftRepository } from "./SharePointShiftRepository";
import { IndexedDBShiftRepository } from "./IndexedDBShiftRepository";

let cached;
export function getShiftRepository() {
  if (cached) return cached;

  const env = getEnv();
  const backend = env.VITE_SHIFT_BACKEND.toLowerCase();

  if (backend === "sharepoint") {
    if (ENABLE_SHAREPOINT) {
      cached = new SharePointShiftRepository();
    } else {
      logInfo(
        "[repositoryFactory] SharePoint backend requested but feature flag disabled – falling back to IndexedDB",
      );
      cached = new IndexedDBShiftRepository();
    }
  } else if (backend === "idx" || backend === "indexeddb") {
    cached = new IndexedDBShiftRepository();
  } else {
    cached = new InMemoryShiftRepository();
  }
  return cached;
}

export default getShiftRepository;
