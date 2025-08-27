import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { ShiftProvider, ShiftContext } from "../contexts/ShiftContext";

// Simple consumer to invoke createShift
function CreateButton({ shift }) {
  const ctx = React.useContext(ShiftContext);
  return <button onClick={() => ctx.createShift(shift)}>create</button>;
}

describe("Shift create persistence", () => {
  test("marks shift pendingSync when repository create fails", () => {
    const failingRepo = {
      list: () => Promise.resolve([]),
      create: () => Promise.reject(new Error("fail")),
      ping: () => Promise.resolve(true),
    };
    render(
      <ShiftProvider
        disableAsyncBootstrap
        repositoryOverride={failingRepo}
        enableAsyncInTests
      >
        <CreateButton
          shift={{
            date: new Date("2025-08-26"),
            type: "Test",
            start: "08:00",
            end: "12:00",
          }}
        />
      </ShiftProvider>,
    );
    fireEvent.click(screen.getByText("create"));
    return waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("shifts") || "[]");
      const created = stored.find((s) => s.id.includes("_Test"));
      expect(created).toBeTruthy();
      expect(created.pendingSync).toBe(true);
    });
  });
});
