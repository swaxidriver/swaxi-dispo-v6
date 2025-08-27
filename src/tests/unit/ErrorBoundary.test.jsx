import { render, screen } from "@testing-library/react";
import React from "react";

import ErrorBoundary from "../../components/ErrorBoundary";
import { registerErrorTelemetry } from "../../utils/errorTelemetry";

function Boom() {
  throw new Error("Kaboom 42");
}

describe("ErrorBoundary", () => {
  let originalError;
  beforeAll(() => {
    // Silence React error boundary noise for this suite only
    originalError = console.error;
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
  it("renders fallback UI and dispatches telemetry on error", () => {
    const events = [];
    registerErrorTelemetry((p) => events.push(p));
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Ein Fehler ist aufgetreten/)).toBeInTheDocument();
    // Telemetry captured
    expect(events.length).toBe(1);
    expect(events[0].message).toMatch(/Kaboom 42/);
  });
});
