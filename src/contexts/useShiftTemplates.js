import { useContext, useMemo } from "react";

import { ShiftTemplateContext } from "./ShiftTemplateContextCore";

// Returns the real template context if mounted, otherwise a safe no-op fallback.
// This lets tests that only mount ShiftProvider (and not ShiftTemplateProvider) still pass.
export function useShiftTemplates() {
  const ctx = useContext(ShiftTemplateContext);
  return useMemo(
    () =>
      ctx || {
        templates: [],
        addTemplate: () => {},
        updateTemplate: () => {},
        deleteTemplate: () => {},
      },
    [ctx],
  );
}

export default useShiftTemplates;
