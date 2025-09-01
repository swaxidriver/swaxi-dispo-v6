import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ShiftTable from "../components/ShiftTable";
import { ShiftContext } from "../contexts/ShiftContext";
import AuthContext from "../contexts/AuthContext";

// Mock the mobile device hook
jest.mock("../hooks/useMobileDevice", () => ({
  useMobileDevice: jest.fn(),
}));

jest.mock("../lib/rbac", () => ({
  canManageShifts: jest.fn(() => false),
}));

// Mock other dependencies
jest.mock("../components/SeriesApplicationModal", () => {
  return function MockSeriesApplicationModal() {
    return <div data-testid="series-modal" />;
  };
});

jest.mock("../features/assignments/components/SingleAssignmentModal", () => {
  return function MockSingleAssignmentModal() {
    return <div data-testid="single-assignment-modal" />;
  };
});

describe("ShiftTable Mobile Integration", () => {
  const mockShifts = [
    {
      id: "1",
      date: new Date("2025-01-25"),
      start: "09:00",
      end: "17:00",
      status: "open",
      assignedTo: null,
      conflicts: [],
    },
    {
      id: "2",
      date: new Date("2025-01-26"),
      start: "10:00",
      end: "18:00",
      status: "assigned",
      assignedTo: "John Doe",
      conflicts: [],
    },
  ];

  const mockShiftContext = {
    applyToShift: jest.fn(),
    assignShift: jest.fn(),
    cancelShift: jest.fn(),
  };

  const mockAuth = {
    user: { id: "1", name: "Test User", role: "analyst" },
  };

  const renderShiftTable = (isMobile = false) => {
    const { useMobileDevice } = require("../hooks/useMobileDevice");
    useMobileDevice.mockReturnValue(isMobile);

    return render(
      <AuthContext.Provider value={mockAuth}>
        <ShiftContext.Provider value={mockShiftContext}>
          <ShiftTable shifts={mockShifts} showActions={true} />
        </ShiftContext.Provider>
      </AuthContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders desktop list view when not on mobile", () => {
    renderShiftTable(false);

    // Should render as list
    expect(screen.getByTestId("shift-list")).toBeInTheDocument();
    expect(screen.queryByTestId("shift-cards")).not.toBeInTheDocument();
  });

  it("renders mobile card view when on mobile", () => {
    renderShiftTable(true);

    // Should render as cards
    expect(screen.getByTestId("shift-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("shift-list")).not.toBeInTheDocument();
  });

  it("renders mobile cards for each shift", () => {
    renderShiftTable(true);

    // Should have two shift cards
    const cards = screen.getAllByTestId("shift-card");
    expect(cards).toHaveLength(2);
  });

  it("uses different item height for virtualized mobile view", () => {
    // Create a large number of shifts to trigger virtualization
    const largeShiftList = Array.from({ length: 150 }, (_, i) => ({
      id: `shift-${i}`,
      date: new Date("2025-01-25"),
      start: "09:00",
      end: "17:00",
      status: "open",
      assignedTo: null,
      conflicts: [],
    }));

    const { useMobileDevice } = require("../hooks/useMobileDevice");
    useMobileDevice.mockReturnValue(true);

    render(
      <AuthContext.Provider value={mockAuth}>
        <ShiftContext.Provider value={mockShiftContext}>
          <ShiftTable shifts={largeShiftList} showActions={true} />
        </ShiftContext.Provider>
      </AuthContext.Provider>,
    );

    // Should use virtualized list for large datasets
    expect(screen.getByTestId("virtualized-shift-list")).toBeInTheDocument();
  });

  it("adds mobile CSS classes when on mobile", () => {
    renderShiftTable(true);

    const container = screen.getByTestId("shift-table");
    expect(container).toHaveClass("mobile-shift-container");
  });
});
