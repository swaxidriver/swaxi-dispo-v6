/* eslint-disable */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShiftProvider } from "../contexts/ShiftContext";
import { useShifts } from "../contexts/useShifts";
import AuthContext from "../contexts/AuthContext";
import ShiftTable from "../components/ShiftTable";

// references for lint (strict unused vars)
expect(ShiftProvider).toBeTruthy();
expect(AuthContext).toBeTruthy();
expect(ShiftTable).toBeTruthy();
expect(useShifts).toBeTruthy();

describe("Shift assignment & notifications", () => {
  const authValue = { user: { name: "Tester", role: "admin" } };

  const _ShiftConsumer = () => {
    const { shifts } = useShifts();
    return <ShiftTable shifts={shifts} />;
  };

  const wrapper = () =>
    render(
      <AuthContext.Provider value={authValue}>
        <ShiftProvider>
          <_ShiftConsumer />
        </ShiftProvider>
      </AuthContext.Provider>,
    );

  it("assigns a shift and updates status", async () => {
    // Provide one open shift manually by mocking initial localStorage state
    const shift = {
      id: "2025-08-25_evening",
      date: new Date("2025-08-25"),
      start: "18:00",
      end: "20:00",
      status: "open",
      type: "evening",
      assignedTo: null,
      workLocation: "office",
      conflicts: [],
    };
    localStorage.setItem("shifts", JSON.stringify([shift]));
    localStorage.removeItem("applications");
    localStorage.removeItem("notifications");

    wrapper();
    const assignBtn = await waitFor(() => screen.getByText("Zuweisen"));
    fireEvent.click(assignBtn);
    // Expect status badge to update to assigned
    const assignedBadge = await screen.findByText(
      (content) => content.toLowerCase() === "assigned",
    );
    expect(assignedBadge).toBeInTheDocument();
  });
});
