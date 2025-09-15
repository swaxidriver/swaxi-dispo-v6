import React from "react";
import { waitFor } from "@testing-library/react";

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

describe("Calendar Month/Week View", () => {
  beforeEach(() => {
    localStorage.clear();
    seedShifts();
  });

  it("renders with week view by default", () => {
    renderWithProviders(<Calendar />);

    expect(screen.getByText("Kalender")).toBeInTheDocument();
    expect(screen.getByText("Wochenübersicht der Dienste")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wochenansicht" })).toHaveClass(
      "bg-[var(--color-primary)]",
    );
    expect(
      screen.getByRole("button", { name: "Monatsansicht" }),
    ).not.toHaveClass("bg-[var(--color-primary)]");
    expect(screen.getByText("Diese Woche")).toBeInTheDocument();
  });

  it("switches to month view when Monat button is clicked", async () => {
    renderWithProviders(<Calendar />);

    const monthButton = screen.getByRole("button", { name: "Monatsansicht" });
    fireEvent.click(monthButton);

    await waitFor(() => {
      expect(
        screen.getByText("Monatsübersicht der Dienste"),
      ).toBeInTheDocument();
    });

    expect(monthButton).toHaveClass("bg-[var(--color-primary)]");
    expect(
      screen.getByRole("button", { name: "Wochenansicht" }),
    ).not.toHaveClass("bg-[var(--color-primary)]");
    expect(screen.getByText("Dieser Monat")).toBeInTheDocument();

    // Should show month header
    const today = new Date();
    const monthName = today.toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(monthName)).toBeInTheDocument();
  });

  it("switches back to week view when Woche button is clicked", async () => {
    renderWithProviders(<Calendar />);

    // Switch to month view first
    fireEvent.click(screen.getByRole("button", { name: "Monatsansicht" }));
    await waitFor(() => {
      expect(
        screen.getByText("Monatsübersicht der Dienste"),
      ).toBeInTheDocument();
    });

    // Switch back to week view
    const weekButton = screen.getByRole("button", { name: "Wochenansicht" });
    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(
        screen.getByText("Wochenübersicht der Dienste"),
      ).toBeInTheDocument();
    });

    expect(weekButton).toHaveClass("bg-[var(--color-primary)]");
    expect(
      screen.getByRole("button", { name: "Monatsansicht" }),
    ).not.toHaveClass("bg-[var(--color-primary)]");
    expect(screen.getByText("Diese Woche")).toBeInTheDocument();
  });

  it("shows appropriate navigation buttons for week view", () => {
    renderWithProviders(<Calendar />);

    expect(
      screen.getByRole("button", { name: "Vorherige Woche" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nächste Woche" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Vorheriger Monat" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Nächster Monat" }),
    ).not.toBeInTheDocument();
  });

  it("shows appropriate navigation buttons for month view", async () => {
    renderWithProviders(<Calendar />);

    fireEvent.click(screen.getByRole("button", { name: "Monatsansicht" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Vorheriger Monat" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Nächster Monat" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "Vorherige Woche" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Nächste Woche" }),
    ).not.toBeInTheDocument();
  });

  it("navigates months correctly in month view", async () => {
    renderWithProviders(<Calendar />);

    // Switch to month view
    fireEvent.click(screen.getByRole("button", { name: "Monatsansicht" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Nächster Monat" }),
      ).toBeInTheDocument();
    });

    const currentMonth = new Date().toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(currentMonth)).toBeInTheDocument();

    // Navigate to next month
    fireEvent.click(screen.getByRole("button", { name: "Nächster Monat" }));

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });

    await waitFor(() => {
      expect(screen.getByText(nextMonthName)).toBeInTheDocument();
    });
  });

  it("preserves selected date when switching views", async () => {
    renderWithProviders(<Calendar />);

    // Navigate to next week in week view
    fireEvent.click(screen.getByRole("button", { name: "Nächste Woche" }));

    // Switch to month view
    fireEvent.click(screen.getByRole("button", { name: "Monatsansicht" }));

    await waitFor(() => {
      expect(
        screen.getByText("Monatsübersicht der Dienste"),
      ).toBeInTheDocument();
    });

    // Switch back to week view - should be on the same date
    fireEvent.click(screen.getByRole("button", { name: "Wochenansicht" }));

    await waitFor(() => {
      expect(
        screen.getByText("Wochenübersicht der Dienste"),
      ).toBeInTheDocument();
    });

    // Should show proper week dates (next week from original)
    expect(screen.getByText("Diese Woche")).toBeInTheDocument();
  });

  it("shows month grid layout in month view", async () => {
    renderWithProviders(<Calendar />);

    fireEvent.click(screen.getByRole("button", { name: "Monatsansicht" }));

    await waitFor(() => {
      expect(
        screen.getByText("Monatsübersicht der Dienste"),
      ).toBeInTheDocument();
    });

    // Should show abbreviated day headers
    expect(screen.getByText("Mo")).toBeInTheDocument();
    expect(screen.getByText("Di")).toBeInTheDocument();
    expect(screen.getByText("Mi")).toBeInTheDocument();
    expect(screen.getByText("Do")).toBeInTheDocument();
    expect(screen.getByText("Fr")).toBeInTheDocument();
    expect(screen.getByText("Sa")).toBeInTheDocument();
    expect(screen.getByText("So")).toBeInTheDocument();
  });
});
