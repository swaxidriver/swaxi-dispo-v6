import { getInitialSeedShifts } from "../seed/initialData";

describe("Deterministic Seed", () => {
  test("snapshot of initial seed shifts remains stable", () => {
    const shifts = getInitialSeedShifts();
    // Remove volatile props if any (none currently)
    expect(shifts).toMatchSnapshot();
  });
});
