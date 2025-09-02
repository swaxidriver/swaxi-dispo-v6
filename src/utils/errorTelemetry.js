// Error telemetry registration utility
// Components (like ErrorBoundary) can import { dispatchErrorTelemetry } to emit.

let handler = null;
export function registerErrorTelemetry(fn) {
  handler = typeof fn === "function" ? fn : null;
}
export function dispatchErrorTelemetry(payload) {
  if (handler) {
    try {
      handler(payload);
    } catch {
      /* swallow */
    }
  } else {
    // no handler registered – noop; explicit branch for coverage
    return false;
  }
  return true;
}

export default { registerErrorTelemetry, dispatchErrorTelemetry };
