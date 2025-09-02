import React from "react";
import { render, waitFor } from "@testing-library/react";

import { ShiftProvider, ShiftContext } from "../contexts/ShiftContext";

function CaptureContext({ holder }) {
  const ctx = React.useContext(ShiftContext);
  holder.current = ctx;
  return null;
}

describe("Shift domain guards", () => {
  test("duplicate shift detection returns reason duplicate", async () => {
    const holder = { current: null };
    render(
      <ShiftProvider disableAsyncBootstrap>
        <CaptureContext holder={holder} />
      </ShiftProvider>,
    );
    const first = holder.current.createShift({
      date: "2025-01-06",
      type: "Frueh",
      start: "06:00",
      end: "14:00",
    });
    expect(first.ok).toBe(true);
    // Wait until shift appears in context state (re-render happened)
    await waitFor(() => {
      expect(
        holder.current.shifts.find((s) => s.id === "2025-01-06_Frueh"),
      ).toBeTruthy();
    });
    const second = holder.current.createShift({
      date: "2025-01-06",
      type: "Frueh",
      start: "06:00",
      end: "14:00",
    });
    expect(second.ok).toBe(false);
    expect(second.reason).toBe("duplicate");
  });
});
