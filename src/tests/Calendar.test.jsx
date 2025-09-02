import React from "react";

import Calendar from "../pages/Calendar";

import { screen, fireEvent, renderWithProviders } from "./testUtils";

jest.mock("../utils/auth", () => ({ canManageShifts: () => true }));

function seedShifts() {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  const overnight = {
    id: `${iso}_Night`,
    date: iso,
    type: "Night",
    start: "22:00",
    end: "04:00",
    status: "open",
  };
  const mid = {
    id: `${iso}_Day`,
    date: iso,
    type: "Day",
    start: "10:00",
    end: "12:00",
    status: "open",
  };
  localStorage.setItem("shifts", JSON.stringify([overnight, mid]));
}

describe("Calendar page", () => {
  it("renders week header and shifts", () => {
    localStorage.clear();
    seedShifts();
    renderWithProviders(<Calendar />);
    expect(screen.getByText("Kalender")).toBeInTheDocument();
    expect(screen.getAllByText("Night").length).toBeGreaterThan(0);
    expect(screen.getByText("Day")).toBeInTheDocument();
  });

  it("navigates weeks forward and back", () => {
    localStorage.clear();
    seedShifts();
    renderWithProviders(<Calendar />);
    const nextBtn = screen.getByRole("button", { name: "Nächste Woche" });
    const prevBtn = screen.getByRole("button", { name: "Vorherige Woche" });
    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
    // Still shows header; basic smoke after navigation
    expect(screen.getByText("Kalender")).toBeInTheDocument();
  });

  it("resets to today", () => {
    localStorage.clear();
    seedShifts();
    renderWithProviders(<Calendar />);
    fireEvent.click(screen.getByRole("button", { name: "Heute" }));
    expect(screen.getByText("Kalender")).toBeInTheDocument();
  });

  it("shows create shift button for manager role", () => {
    localStorage.clear();
    seedShifts();
    renderWithProviders(<Calendar />);
    expect(
      screen.getByRole("button", { name: "Dienst erstellen" }),
    ).toBeInTheDocument();
  });
});
