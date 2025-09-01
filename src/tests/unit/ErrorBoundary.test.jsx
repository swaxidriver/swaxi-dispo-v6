import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import ErrorBoundary from "../../components/ErrorBoundary";
import { registerErrorTelemetry } from "../../utils/errorTelemetry";

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

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
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("displays error ID and enhanced diagnostics", () => {
    const events = [];
    registerErrorTelemetry((p) => events.push(p));
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    // Check for error ID display
    expect(screen.getByText(/Fehler-ID:/)).toBeInTheDocument();
    const errorIdElement = screen.getByText(/ERR-[A-F0-9]{8}/);
    expect(errorIdElement).toBeInTheDocument();

    // Check for enhanced UI elements
    expect(screen.getByText("Neu laden")).toBeInTheDocument();
    expect(screen.getByText("Diagnose kopieren")).toBeInTheDocument();
    expect(
      screen.getByText(/Bitte teilen Sie die Fehler-ID/),
    ).toBeInTheDocument();

    // Check enhanced telemetry payload
    expect(events[0]).toMatchObject({
      errorId: expect.stringMatching(/^ERR-[A-F0-9]{8}$/),
      message: "Kaboom 42",
      timestamp: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      ),
      version: "6.0.1",
      userAgent: expect.any(String),
      url: expect.any(String),
    });
  });

  it("copies diagnostics to clipboard when button is clicked", async () => {
    mockClipboard.writeText.mockResolvedValue();
    registerErrorTelemetry(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    const copyButton = screen.getByText("Diagnose kopieren");
    fireEvent.click(copyButton);

    // Wait for clipboard operation
    await screen.findByText("Kopiert!");

    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("Error ID: ERR-"),
    );
    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("Kaboom 42"),
    );
  });
});
