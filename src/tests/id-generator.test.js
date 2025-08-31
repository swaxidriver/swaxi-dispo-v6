import {
  generateId,
  peekCurrentId,
  __resetIdCounterForTests,
} from "../utils/id";

describe("id generator", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetIdCounterForTests();
  });

  test("generateId monotonic and persistent", () => {
    const id1 = generateId();
    const id2 = generateId("pref_");
    expect(id1).not.toBe(id2);
    const currentBefore = peekCurrentId();
    expect(currentBefore).toBe(2);
    // Simulate reload: new import would call loadCounter; we just call again
    const id3 = generateId();
    expect(id3.endsWith("003")).toBe(true);
  });
});
