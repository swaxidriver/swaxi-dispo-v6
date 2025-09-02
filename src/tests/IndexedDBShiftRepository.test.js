import { IndexedDBShiftRepository } from "../repository/IndexedDBShiftRepository";

describe("IndexedDBShiftRepository", () => {
  test("CRUD + domain operations", async () => {
    const repo = new IndexedDBShiftRepository({
      dbName: "swaxi_dispo_test_" + Date.now(),
    });
    // empty
    expect(await repo.list()).toHaveLength(0);
    // create
    const created = await repo.create({
      id: "s1",
      start: "10:00",
      end: "12:00",
      status: "open",
    });
    expect(created.id).toBe("s1");
    expect((await repo.list()).map((s) => s.id)).toEqual(["s1"]);
    // apply
    await repo.applyToShift("s1", "u1");
    const afterApply = (await repo.list())[0];
    expect(afterApply.lastApplicant).toBe("u1");
    // assign
    await repo.assignShift("s1", "userA");
    const afterAssign = (await repo.list())[0];
    expect(afterAssign.status).toBe("assigned");
    expect(afterAssign.assignedTo).toBe("userA");
    // cancel
    await repo.cancelShift("s1");
    const afterCancel = (await repo.list())[0];
    expect(afterCancel.status).toBe("cancelled");
    // update
    await repo.update("s1", { start: "11:00" });
    const afterUpdate = (await repo.list())[0];
    expect(afterUpdate.start).toBe("11:00");
  });
});
