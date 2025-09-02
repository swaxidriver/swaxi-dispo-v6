import { validateShiftObject, validateShiftArray } from "../utils/validation";

describe("validation utils", () => {
  it("accepts a well-formed shift", () => {
    const shift = {
      id: "d1",
      date: new Date(),
      type: "x",
      start: "10:00",
      end: "11:00",
      status: "open",
      assignedTo: null,
      workLocation: "office",
      conflicts: [],
    };
    expect(validateShiftObject(shift, { log: () => {} })).toBe(true);
  });

  it("filters malformed shifts", () => {
    const good = {
      id: "ok",
      date: new Date(),
      type: "x",
      start: "10:00",
      end: "11:00",
      status: "open",
      assignedTo: null,
      workLocation: "office",
      conflicts: [],
    };
    const bad = { id: "bad", date: new Date(), type: "x" }; // missing fields
    const filtered = validateShiftArray([good, bad], { log: () => {} });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("ok");
  });
});
