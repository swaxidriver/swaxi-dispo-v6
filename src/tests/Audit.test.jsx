import React from "react";

import Audit from "../pages/Audit";
import AuditService from "../services/auditService";

import { screen, fireEvent, renderWithProviders } from "./testUtils";

describe("Audit page", () => {
  beforeEach(() => {
    localStorage.clear();
    // Seed some audit logs (German action strings to categorize)
    AuditService.logAction(
      "Schicht erstellt",
      "Admin User",
      "admin",
      "Neue Frühschicht",
    );
    AuditService.logAction(
      "Fahrzeugstatus geändert",
      "Admin User",
      "admin",
      "Status auf bereit gesetzt",
    );
    AuditService.logAction(
      "Urlaubsantrag eingereicht",
      "Admin User",
      "admin",
      "2 Tage im September",
    );
  });

  it("renders heading and seeded logs initially", () => {
    renderWithProviders(<Audit />);
    expect(screen.getByText("Audit-Log")).toBeInTheDocument();
    expect(screen.getByText("Schicht erstellt")).toBeInTheDocument();
    expect(screen.getByText("Fahrzeugstatus geändert")).toBeInTheDocument();
    expect(screen.getByText("Urlaubsantrag eingereicht")).toBeInTheDocument();
  });

  it("filters by type", () => {
    renderWithProviders(<Audit />);
    fireEvent.change(screen.getByDisplayValue("Alle Aktivitäten"), {
      target: { value: "create" },
    });
    expect(screen.getByText("Schicht erstellt")).toBeInTheDocument();
    // Non-create entries should be filtered out
    expect(screen.queryByText("Fahrzeugstatus geändert")).toBeNull();
  });
});
