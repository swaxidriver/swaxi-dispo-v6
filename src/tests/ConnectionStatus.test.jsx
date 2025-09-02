import { render, screen, fireEvent } from "@testing-library/react";

import ConnectionStatus from "../components/ConnectionStatus";

jest.mock("../contexts/useShifts", () => ({
  useShifts: jest.fn(),
}));

const { useShifts } = jest.requireMock("../contexts/useShifts");

function setState(overrides) {
  useShifts.mockReturnValue({
    state: {
      dataSource: "localStorage",
      isOnline: false,
      lastSync: null,
      ...overrides,
    },
  });
}

describe("ConnectionStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows sharepoint connected state (green)", () => {
    const lastSync = new Date("2025-08-26T12:34:56Z");
    setState({ dataSource: "sharePoint", isOnline: true, lastSync });
    render(<ConnectionStatus />);
    expect(screen.getByText("🟢")).toBeInTheDocument();
    expect(screen.getByText("SharePoint verbunden")).toBeInTheDocument();
    expect(screen.getByText(/Letzte Sync:/)).toBeInTheDocument();
  });

  test("shows localStorage offline mode with tip (yellow)", () => {
    setState({ dataSource: "localStorage", isOnline: false });
    render(<ConnectionStatus />);
    expect(screen.getByText("🟡")).toBeInTheDocument();
    expect(
      screen.getByText("Offline-Modus (localStorage)"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tipp:/)).toBeInTheDocument();
  });

  test("shows error state (red) when sharepoint not online", () => {
    setState({ dataSource: "sharePoint", isOnline: false });
    render(<ConnectionStatus />);
    expect(screen.getByText("🔴")).toBeInTheDocument();
    expect(screen.getByText("Verbindungsfehler")).toBeInTheDocument();
  });

  test("clicking test button triggers handler (smoke)", () => {
    setState({ dataSource: "localStorage", isOnline: false });
    render(<ConnectionStatus />);
    const btn = screen.getByRole("button", { name: "🔗 Verbindung testen" });
    fireEvent.click(btn);
    // Button remains enabled after async sequence completes
    expect(btn).toBeEnabled();
  });
});
