import {
  getShiftTemplateColor,
  getShiftDisplayStyles,
  QUICK_ACTIONS,
} from "../ui/calendar-views";

describe("Calendar Views", () => {
  const mockTemplates = [
    { id: "template1", name: "Evening", color: "#3B82F6" },
    { id: "template2", name: "Night", color: "#EF4444" },
    { id: "template3", name: "Day", color: "#10B981" },
  ];

  describe("getShiftTemplateColor", () => {
    it("returns template color by templateId", () => {
      const shift = { templateId: "template1", name: "Evening" };
      expect(getShiftTemplateColor(shift, mockTemplates)).toBe("#3B82F6");
    });

    it("returns template color by name fallback", () => {
      const shift = { name: "Night" };
      expect(getShiftTemplateColor(shift, mockTemplates)).toBe("#EF4444");
    });

    it("returns default color for unknown template", () => {
      const shift = { name: "Unknown" };
      expect(getShiftTemplateColor(shift, mockTemplates)).toBe("#6B7280");
    });

    it("handles null/undefined inputs", () => {
      expect(getShiftTemplateColor(null, mockTemplates)).toBe("#6B7280");
      expect(getShiftTemplateColor({}, null)).toBe("#6B7280");
    });
  });

  describe("getShiftDisplayStyles", () => {
    it("generates correct styles for assigned shift", () => {
      const shift = { templateId: "template1", assignedTo: "John" };
      const styles = getShiftDisplayStyles(shift, mockTemplates);

      expect(styles.backgroundColor).toMatch(/rgba\(59, 130, 246, 0\.2\)/);
      expect(styles.borderColor).toMatch(/rgba\(59, 130, 246, 0\.6\)/);
      expect(styles.color).toBe("#3B82F6");
    });

    it("generates correct styles for unassigned shift", () => {
      const shift = { templateId: "template1" };
      const styles = getShiftDisplayStyles(shift, mockTemplates);

      expect(styles.backgroundColor).toMatch(/rgba\(59, 130, 246, 0\.1\)/);
      expect(styles.borderColor).toMatch(/rgba\(59, 130, 246, 0\.4\)/);
    });
  });

  describe("QUICK_ACTIONS", () => {
    it("defines all required actions", () => {
      expect(QUICK_ACTIONS.SWAP).toBe("swap");
      expect(QUICK_ACTIONS.RELEASE).toBe("release");
      expect(QUICK_ACTIONS.NOTE).toBe("note");
    });
  });
});
