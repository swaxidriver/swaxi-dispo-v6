import { Component } from "react";

import { logError } from "../utils/logger";
import { dispatchErrorTelemetry } from "../utils/errorTelemetry";
import {
  generateErrorId,
  createErrorPayload,
  copyErrorDiagnostics,
} from "../ui/error-boundaries";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      errorId: null,
      errorPayload: null,
      copied: false,
    };
  }
  static getDerivedStateFromError(error) {
    const errorId = generateErrorId();
    return { error, errorId };
  }
  componentDidCatch(error, info) {
    const { errorId } = this.state;
    const payload = createErrorPayload(error, info, errorId);

    this.setState({ errorPayload: payload });

    logError("ErrorBoundary captured error", payload);
    try {
      dispatchErrorTelemetry(payload);
    } catch (e) {
      logError("Telemetry handler failed", e);
    }
  }
  handleReload = () => {
    window.location.reload();
  };
  handleCopyDiagnostics = async () => {
    const { errorPayload } = this.state;
    if (errorPayload) {
      const success = await copyErrorDiagnostics(errorPayload);
      if (success) {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      }
    }
  };
  render() {
    const { error, errorId, copied } = this.state;
    if (error) {
      return (
        <div role="alert" className="p-6 text-red-700 bg-red-50 rounded">
          <h2 className="font-semibold mb-2">Ein Fehler ist aufgetreten</h2>
          {errorId && (
            <p className="text-sm text-red-600 mb-3">
              Fehler-ID:{" "}
              <code className="bg-red-100 px-1 rounded">{errorId}</code>
            </p>
          )}
          <pre className="text-xs whitespace-pre-wrap mb-4">
            {String(error.message || error)}
          </pre>
          <div className="flex gap-2">
            <button
              className="btn btn-primary px-3 py-1"
              onClick={this.handleReload}
            >
              Neu laden
            </button>
            <button
              className="btn btn-secondary px-3 py-1"
              onClick={this.handleCopyDiagnostics}
              disabled={copied}
            >
              {copied ? "Kopiert!" : "Diagnose kopieren"}
            </button>
          </div>
          <p className="text-xs text-red-500 mt-3">
            Bitte teilen Sie die Fehler-ID und die kopierten Diagnosedaten mit
            dem Support-Team.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
