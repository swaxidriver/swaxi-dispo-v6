import { useState, useEffect } from "react";

import AppProviders from "./components/AppProviders";
import AppLayout from "./components/AppLayout";
import { registerServerErrorTelemetry } from "./ui/error-boundaries";
import { validateEnv } from "./config/env";
import "./App.css";

// Register server error telemetry once during app initialization
registerServerErrorTelemetry();

// Validate environment configuration early - fail fast on invalid config
try {
  validateEnv({ strict: true });
} catch (error) {
  console.error("❌ Environment validation failed:", error.message);
  console.error("Please check your .env file against .env.example");
  throw error;
}

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // minimal defer to allow ShiftProvider bootstrap; could watch context instead
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <AppProviders>
      <AppLayout ready={ready} />
    </AppProviders>
  );
}

export default App;
