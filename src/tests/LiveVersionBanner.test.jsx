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
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test("renders with demo badge and localStorage icon", () => {
    setState({ dataSource: { source: "localStorage" } });
    render(<LiveVersionBanner />);
    expect(screen.getByText(/Swaxi Dispo v6.0.0/)).toBeInTheDocument();
    expect(screen.getByText("🧪 Demo")).toBeInTheDocument();
    expect(screen.getByText(/💾/)).toBeInTheDocument();
  });

  test("dismiss button hides banner and stores flag", () => {
    setState({ dataSource: { source: "localStorage" } });
    render(<LiveVersionBanner />);
    const btn = screen.getByRole("button", { name: "Banner schließen" });
    fireEvent.click(btn);
    // After dismissal banner should be removed
    expect(screen.queryByText(/Swaxi Dispo v6.0.0/)).not.toBeInTheDocument();
    expect(sessionStorage.getItem("bannerDismissed")).toBe("true");
  });
});
