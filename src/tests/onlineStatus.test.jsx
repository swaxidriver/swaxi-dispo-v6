import { renderWithProviders, act } from "./testUtils";

describe("ShiftContext isOnline heartbeat", () => {
  it("sets isOnline boolean after heartbeat", async () => {
    let ctx;
    function Probe() {
      ctx = require("../contexts/useShifts").useShifts();
      return null;
    }
    renderWithProviders(<Probe />, {
      providerProps: { heartbeatMs: 5, enableAsyncInTests: true },
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 25));
    });
    expect(typeof ctx.isOnline).toBe("boolean");
  });
});
