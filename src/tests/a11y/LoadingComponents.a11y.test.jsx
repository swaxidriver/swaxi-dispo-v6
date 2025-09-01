import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

import {
  LoadingSpinner,
  LoadingButton,
  LoadingOverlay,
} from "../../components/LoadingComponents";
import { useAccessibleAsyncOperation } from "../../hooks/useAccessibleAsync";

// Mock the LiveRegion class
jest.mock("../../ui/accessibility", () => ({
  LiveRegion: jest.fn().mockImplementation(() => ({
    announce: jest.fn(),
    destroy: jest.fn(),
  })),
}));

describe("Accessibility Loading Components", () => {
  describe("LoadingSpinner", () => {
    it("has proper ARIA attributes when loading", () => {
      render(<LoadingSpinner isLoading={true} loadingText="Test lädt..." />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-label", "Test lädt...");

      // Screen reader text should be present
      expect(screen.getByText("Test lädt...")).toHaveClass("sr-only");
    });

    it("renders children when not loading", () => {
      render(
        <LoadingSpinner isLoading={false}>
          <div>Content loaded</div>
        </LoadingSpinner>,
      );

      expect(screen.getByText("Content loaded")).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("supports different variants", () => {
      const { rerender } = render(
        <LoadingSpinner isLoading={true} variant="dots" />,
      );
      expect(screen.getByRole("status")).toBeInTheDocument();

      rerender(<LoadingSpinner isLoading={true} variant="pulse" />);
      expect(screen.getByRole("status")).toBeInTheDocument();

      rerender(<LoadingSpinner isLoading={true} variant="spinner" />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("LoadingButton", () => {
    it("is disabled and has aria-busy when loading", () => {
      render(
        <LoadingButton isLoading={true} loadingText="Speichert...">
          Speichern
        </LoadingButton>,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAttribute("aria-busy", "true");

      // Button text should be present but hidden
      expect(screen.getByText("Speichern")).toHaveClass("opacity-0");
    });

    it("is clickable when not loading", () => {
      const onClick = jest.fn();
      render(
        <LoadingButton isLoading={false} onClick={onClick}>
          Speichern
        </LoadingButton>,
      );

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "false");

      fireEvent.click(button);
      expect(onClick).toHaveBeenCalled();
    });

    it("remains disabled when explicitly disabled", () => {
      render(
        <LoadingButton isLoading={false} disabled={true}>
          Speichern
        </LoadingButton>,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("LoadingOverlay", () => {
    it("shows overlay with proper ARIA when loading", () => {
      render(
        <LoadingOverlay isLoading={true} loadingText="Daten werden geladen...">
          <div>Content underneath</div>
        </LoadingOverlay>,
      );

      expect(screen.getByText("Content underneath")).toBeInTheDocument();

      const overlays = screen.getAllByRole("status");
      const mainOverlay = overlays.find(
        (overlay) =>
          overlay.getAttribute("aria-live") === "polite" &&
          overlay.getAttribute("aria-busy") === "true",
      );

      expect(mainOverlay).toBeInTheDocument();
      expect(screen.getByText("Daten werden geladen...")).toBeInTheDocument();
    });

    it("only shows content when not loading", () => {
      render(
        <LoadingOverlay isLoading={false}>
          <div>Content visible</div>
        </LoadingOverlay>,
      );

      expect(screen.getByText("Content visible")).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});

// Test component for useAccessibleAsyncOperation hook
function TestAsyncComponent({ onExecute }) {
  const {
    execute,
    isLoading,
    error,
    getLoadingProps,
    getDisabledProps,
    announce,
  } = useAccessibleAsyncOperation(onExecute, {
    loadingMessage: "Verarbeitet...",
    successMessage: "Erfolgreich!",
    errorMessage: "Fehler aufgetreten!",
  });

  return (
    <div>
      <button
        onClick={() => execute("test")}
        {...getDisabledProps()}
        data-testid="execute-btn"
      >
        Ausführen
      </button>
      <div {...getLoadingProps()} data-testid="status">
        {isLoading ? "Lädt..." : "Bereit"}
      </div>
      {error && <div data-testid="error">{error}</div>}
      <button
        onClick={() => announce("Test message")}
        data-testid="announce-btn"
      >
        Ansage
      </button>
    </div>
  );
}

describe("useAccessibleAsyncOperation", () => {
  it("provides correct ARIA props during loading", async () => {
    const mockFn = jest.fn().mockResolvedValue("success");
    render(<TestAsyncComponent onExecute={mockFn} />);

    const statusDiv = screen.getByTestId("status");
    const executeBtn = screen.getByTestId("execute-btn");

    // Initially not loading
    expect(statusDiv).toHaveAttribute("aria-busy", "false");
    expect(executeBtn).not.toBeDisabled();

    // Click to start loading
    fireEvent.click(executeBtn);

    // Should be loading
    expect(statusDiv).toHaveAttribute("aria-busy", "true");
    expect(executeBtn).toBeDisabled();
    expect(executeBtn).toHaveAttribute("aria-disabled", "true");

    // Wait for completion
    await waitFor(() => {
      expect(statusDiv).toHaveAttribute("aria-busy", "false");
    });

    expect(executeBtn).not.toBeDisabled();
    expect(mockFn).toHaveBeenCalledWith("test");
  });

  it("handles errors properly", async () => {
    // This test verifies error handling but doesn't test live announcements
    const mockFn = jest.fn().mockRejectedValue(new Error("Test error"));

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    try {
      render(<TestAsyncComponent onExecute={mockFn} />);

      fireEvent.click(screen.getByTestId("execute-btn"));

      await waitFor(
        () => {
          expect(screen.getByTestId("error")).toHaveTextContent("Test error");
        },
        { timeout: 3000 },
      );
    } finally {
      console.error = originalError;
    }
  });

  it("allows manual announcements", () => {
    const mockFn = jest.fn().mockResolvedValue("success");
    render(<TestAsyncComponent onExecute={mockFn} />);

    // Manual announce should work without errors
    fireEvent.click(screen.getByTestId("announce-btn"));
    // Note: We can't easily test the live region announcement without DOM inspection
  });
});
