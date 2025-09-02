import { render, screen, fireEvent } from "@testing-library/react";

import LiveVersionBanner from "../components/LiveVersionBanner";

jest.mock("../contexts/useShifts", () => ({
  useShifts: jest.fn(),
}));

const { useShifts } = jest.requireMock("../contexts/useShifts");

function setState(overrides) {
  useShifts.mockReturnValue({
    state: {
      dataSource: "localStorage",
      ...overrides,
    },
  });
}

describe("LiveVersionBanner", () => {
  let mockQuerySelector;

  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();

    // Mock document.querySelector for meta tag
    mockQuerySelector = jest.fn();
    document.querySelector = mockQuerySelector;

    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore original querySelector and timers
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test("renders with demo badge and localStorage icon when versions match", () => {
    // Mock meta tag to return same version (no update)
    mockQuerySelector.mockImplementation((selector) => {
      if (selector === 'meta[name="app-version"]') {
        return { content: "6.0.0" }; // Same version, no update available
      }
      return null;
    });

    setState({ dataSource: { source: "localStorage" } });
    render(<LiveVersionBanner />);

    // Let the checkForUpdates effect run
    jest.runOnlyPendingTimers();

    expect(screen.getByText(/Swaxi Dispo v6.0.0/)).toBeInTheDocument();
    expect(screen.getByText("🧪 Demo")).toBeInTheDocument();
    expect(screen.getByText(/💾/)).toBeInTheDocument();
  });

  test("dismiss button hides banner and stores flag", () => {
    // Mock meta tag to return same version (no update)
    mockQuerySelector.mockImplementation((selector) => {
      if (selector === 'meta[name="app-version"]') {
        return { content: "6.0.0" }; // Same version, no update available
      }
      return null;
    });

    setState({ dataSource: { source: "localStorage" } });
    render(<LiveVersionBanner />);

    // Let the checkForUpdates effect run
    jest.runOnlyPendingTimers();

    const btn = screen.getByRole("button", { name: "Banner schließen" });
    fireEvent.click(btn);
    // After dismissal banner should be removed
    expect(screen.queryByText(/Swaxi Dispo v6.0.0/)).not.toBeInTheDocument();
    expect(sessionStorage.getItem("bannerDismissed")).toBe("true");
  });

  test("shows update banner when version differs", () => {
    // Mock meta tag to return different version
    mockQuerySelector.mockImplementation((selector) => {
      if (selector === 'meta[name="app-version"]') {
        return { content: "6.1.0" }; // Different version, update available
      }
      return null;
    });

    setState({ dataSource: { source: "localStorage" } });
    render(<LiveVersionBanner />);

    // Let the checkForUpdates effect run
    jest.runOnlyPendingTimers();

    // Should show update banner instead of regular banner
    expect(
      screen.getByText(/Neue Version verfügbar – neu laden/),
    ).toBeInTheDocument();
    expect(screen.getByText("Neu laden")).toBeInTheDocument();
  });

  test("can dismiss update banner", () => {
    // Mock meta tag to return different version
    mockQuerySelector.mockImplementation((selector) => {
      if (selector === 'meta[name="app-version"]') {
        return { content: "6.1.0" }; // Different version, update available
      }
      return null;
    });

    setState({ dataSource: { source: "localStorage" } });
    render(<LiveVersionBanner />);

    // Let the checkForUpdates effect run
    jest.runOnlyPendingTimers();

    // Should show update banner
    expect(
      screen.getByText(/Neue Version verfügbar – neu laden/),
    ).toBeInTheDocument();

    // Click dismiss button
    const dismissButton = screen.getByRole("button", {
      name: "Update-Benachrichtigung ausblenden",
    });
    fireEvent.click(dismissButton);

    // Update banner should be hidden
    expect(
      screen.queryByText(/Neue Version verfügbar – neu laden/),
    ).not.toBeInTheDocument();
  });
});
