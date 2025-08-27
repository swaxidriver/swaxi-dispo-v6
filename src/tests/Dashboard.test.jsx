import React from "react";

import Dashboard from "../pages/Dashboard";

import { screen, fireEvent, renderWithProviders } from "./testUtils";

jest.mock("../utils/auth", () => ({
  canManageShifts: () => true,
}));

const todayIso = new Date().toISOString().slice(0, 10);
const sixDaysAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000)
  .toISOString()
  .slice(0, 10);
const baseShifts = [
  {
    id: `${todayIso}_Fahrt`,
    date: todayIso,
    type: "Fahrt",
    start: "08:00",
    end: "12:00",
    status: "open",
  },
  {
    id: `${todayIso}_Tour`,
    date: todayIso,
    type: "Tour",
    start: "13:00",
    end: "16:00",
    status: "assigned",
  },
  {
    id: `${sixDaysAgo}_Alt`,
    date: sixDaysAgo,
    type: "Alt",
    start: "09:00",
    end: "10:00",
    status: "cancelled",
  },
];

describe("Dashboard page", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("shifts", JSON.stringify(baseShifts));
  });

  it("renders heading and analytics", () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Aktuelle Dienste")).toBeInTheDocument();
  });

  it("filters by status (open, assigned, cancelled)", () => {
    renderWithProviders(<Dashboard />);
    // Open filter shows open badge
    fireEvent.click(screen.getByRole("button", { name: "Offen" }));
    expect(screen.getAllByText("open").length).toBeGreaterThan(0);
    // Assigned filter
    fireEvent.click(screen.getByRole("button", { name: "Zugewiesen" }));
    expect(screen.getAllByText("assigned").length).toBeGreaterThan(0);
    // Cancelled filter
    fireEvent.click(screen.getByRole("button", { name: "Abgesagt" }));
    expect(screen.getAllByText("cancelled").length).toBeGreaterThan(0);
  });

  it("shows auto assign button when user can manage shifts", () => {
    renderWithProviders(<Dashboard />);
    expect(
      screen.getByRole("button", { name: /Automatisch zuteilen/ }),
    ).toBeInTheDocument();
  });
});
