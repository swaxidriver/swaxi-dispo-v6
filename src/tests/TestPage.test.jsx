import React from "react";

import TestPage from "../pages/TestPage";

import { screen, fireEvent, renderWithProviders, act } from "./testUtils";

// Mock sharePointService methods used
jest.mock("../services/sharePointService", () => ({
  sharePointService: {
    isSharePointAvailable: jest.fn().mockResolvedValue(false),
    getShifts: jest.fn().mockResolvedValue([]),
    logAudit: jest.fn().mockResolvedValue(undefined),
    createShift: jest.fn().mockResolvedValue({ id: "test-id" }),
  },
}));

// Mock useShifts hook directly (simpler & avoids context shape coupling)
jest.mock("../contexts/useShifts", () => ({
  useShifts: () => ({
    state: { dataSource: "localStorage", isOnline: false, shifts: [] },
  }),
}));

describe("TestPage", () => {
  it("renders heading and status blocks", () => {
    renderWithProviders(<TestPage />);
    expect(screen.getByText("Hybrid-Modus Testen")).toBeInTheDocument();
    expect(screen.getByText(/Datenquelle/)).toBeInTheDocument();
  });

  it("runs tests and shows results", async () => {
    renderWithProviders(<TestPage />);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "🚀 Alle Tests starten" }),
      );
    });
    expect(screen.getByText("Test-Ergebnisse")).toBeInTheDocument();
  });
});
