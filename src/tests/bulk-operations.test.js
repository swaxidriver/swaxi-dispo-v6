/**
 * Tests for bulk operations functionality
 */

import {
  copyWeekToNext,
  swapAssignments,
  multiAssignShifts,
  multiUnassignShifts,
  handleMultiSelect,
} from "../ui/bulk-operations";
import { AuditService } from "../services/auditService";

// Mock the audit service
jest.mock("../services/auditService", () => ({
  AuditService: {
    logAction: jest.fn(),
  },
}));

// Mock repository
const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  swapAssignments: jest.fn(),
  delete: jest.fn(),
  listAssignments: jest.fn(),
};

describe("Bulk Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("copyWeekToNext", () => {
    it("should copy shifts to next week with date shifting", async () => {
      const sourceShifts = [
        {
          id: "shift_1",
          date: "2025-01-06", // Monday
          type: "morning",
          start: "08:00",
          end: "16:00",
          status: "assigned",
          assignedTo: "John Doe",
        },
        {
          id: "shift_2",
          date: "2025-01-07", // Tuesday
          type: "evening",
          start: "16:00",
          end: "24:00",
          status: "open",
          assignedTo: null,
        },
      ];

      mockRepository.create.mockResolvedValue({});

      const result = await copyWeekToNext(sourceShifts, mockRepository, {
        actor: "Test User",
        role: "ADMIN",
      });

      // Should create 2 new shifts
      expect(mockRepository.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);

      // Check date shifting (7 days forward)
      const copiedShift1 = mockRepository.create.mock.calls[0][0];
      expect(copiedShift1.date).toEqual(new Date("2025-01-13")); // Monday + 7 days
      expect(copiedShift1.status).toBe("open"); // Reset status
      expect(copiedShift1.assignedTo).toBeNull(); // Reset assignment

      // Audit should be logged
      expect(AuditService.logAction).toHaveBeenCalledWith(
        "week_copied",
        "Test User",
        "ADMIN",
        expect.objectContaining({
          sourceWeekCount: 2,
          copiedWeekCount: 2,
        }),
        2,
      );
    });

    it("should handle copy failures and log audit trail", async () => {
      const sourceShifts = [
        {
          id: "shift_1",
          date: "2025-01-06",
          type: "morning",
          start: "08:00",
          end: "16:00",
        },
      ];

      mockRepository.create.mockRejectedValue(new Error("Creation failed"));

      await expect(
        copyWeekToNext(sourceShifts, mockRepository),
      ).rejects.toThrow("Creation failed");

      expect(AuditService.logAction).toHaveBeenCalledWith(
        "week_copy_failed",
        "Unknown User",
        "USER",
        expect.objectContaining({
          error: "Creation failed",
          shiftCount: 1,
        }),
      );
    });
  });

  describe("swapAssignments", () => {
    it("should swap assignments and log audit trail", async () => {
      const assignment1 = {
        id: "assign_1",
        assignedTo: "John Doe",
        shift_instance_id: "shift_1",
      };
      const assignment2 = {
        id: "assign_2",
        assignedTo: "Jane Smith",
        shift_instance_id: "shift_2",
      };

      mockRepository.findById
        .mockResolvedValueOnce(assignment1)
        .mockResolvedValueOnce(assignment2);
      mockRepository.swapAssignments.mockResolvedValue({});

      await swapAssignments("assign_1", "assign_2", mockRepository, {
        actor: "Admin User",
        role: "ADMIN",
      });

      expect(mockRepository.swapAssignments).toHaveBeenCalledWith(
        "assign_1",
        "assign_2",
      );

      expect(AuditService.logAction).toHaveBeenCalledWith(
        "assignments_swapped",
        "Admin User",
        "ADMIN",
        expect.objectContaining({
          assignment1: expect.objectContaining({
            id: "assign_1",
            disponentFrom: "John Doe",
          }),
          assignment2: expect.objectContaining({
            id: "assign_2",
            disponentFrom: "Jane Smith",
          }),
        }),
        2,
      );
    });

    it("should handle swap failures", async () => {
      mockRepository.findById.mockResolvedValue(null); // Assignment not found

      await expect(
        swapAssignments("assign_1", "assign_2", mockRepository),
      ).rejects.toThrow("One or both assignments not found");

      expect(AuditService.logAction).toHaveBeenCalledWith(
        "assignments_swap_failed",
        "Unknown User",
        "USER",
        expect.objectContaining({
          error: "One or both assignments not found",
        }),
      );
    });
  });

  describe("multiAssignShifts", () => {
    it("should assign multiple shifts to a disponent", async () => {
      const shiftIds = ["shift_1", "shift_2", "shift_3"];
      mockRepository.create.mockResolvedValue({});

      const result = await multiAssignShifts(
        shiftIds,
        "John Doe",
        mockRepository,
        {
          actor: "Manager",
          role: "MANAGER",
        },
      );

      expect(mockRepository.create).toHaveBeenCalledTimes(3);
      expect(result.assignments).toHaveLength(3);
      expect(result.failures).toHaveLength(0);

      // Check assignment structure
      const assignment = mockRepository.create.mock.calls[0][0];
      expect(assignment.assignedTo).toBe("John Doe");
      expect(assignment.status).toBe("assigned");

      expect(AuditService.logAction).toHaveBeenCalledWith(
        "multi_assign_completed",
        "Manager",
        "MANAGER",
        expect.objectContaining({
          disponentName: "John Doe",
          successfulAssignments: 3,
          failedAssignments: 0,
        }),
        3,
      );
    });

    it("should handle partial failures in multi-assign", async () => {
      const shiftIds = ["shift_1", "shift_2"];
      mockRepository.create
        .mockResolvedValueOnce({}) // First succeeds
        .mockRejectedValueOnce(new Error("Assignment conflict")); // Second fails

      const result = await multiAssignShifts(
        shiftIds,
        "John Doe",
        mockRepository,
      );

      expect(result.assignments).toHaveLength(1);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]).toEqual({
        shiftId: "shift_2",
        error: "Assignment conflict",
      });
    });
  });

  describe("multiUnassignShifts", () => {
    it("should unassign multiple shifts", async () => {
      const shiftIds = ["shift_1", "shift_2"];

      mockRepository.listAssignments
        .mockResolvedValueOnce([{ id: "assign_1" }]) // shift_1 has one assignment
        .mockResolvedValueOnce([{ id: "assign_2" }, { id: "assign_3" }]); // shift_2 has two assignments

      mockRepository.delete.mockResolvedValue({});

      const result = await multiUnassignShifts(shiftIds, mockRepository);

      expect(mockRepository.delete).toHaveBeenCalledTimes(3); // Total assignments removed
      expect(result.unassignments).toHaveLength(3);
      expect(result.failures).toHaveLength(0);

      expect(AuditService.logAction).toHaveBeenCalledWith(
        "multi_unassign_completed",
        "Unknown User",
        "USER",
        expect.objectContaining({
          successfulUnassignments: 3,
          failedUnassignments: 0,
        }),
        3,
      );
    });
  });

  describe("handleMultiSelect", () => {
    const allItems = [
      { id: "item_1" },
      { id: "item_2" },
      { id: "item_3" },
      { id: "item_4" },
      { id: "item_5" },
    ];

    it("should handle regular click (replace selection)", () => {
      const currentSelection = ["item_1", "item_2"];

      const newSelection = handleMultiSelect(
        currentSelection,
        "item_3",
        allItems,
      );

      expect(newSelection).toEqual(["item_3"]);
    });

    it("should handle ctrl+click (toggle selection)", () => {
      const currentSelection = ["item_1", "item_2"];

      // Add new item
      const newSelection1 = handleMultiSelect(
        currentSelection,
        "item_3",
        allItems,
        false,
        true,
      );
      expect(newSelection1).toEqual(["item_1", "item_2", "item_3"]);

      // Remove existing item
      const newSelection2 = handleMultiSelect(
        currentSelection,
        "item_1",
        allItems,
        false,
        true,
      );
      expect(newSelection2).toEqual(["item_2"]);
    });

    it("should handle shift+click (range selection)", () => {
      const currentSelection = ["item_2"];

      // Select from item_2 to item_4 (range)
      const newSelection = handleMultiSelect(
        currentSelection,
        "item_4",
        allItems,
        true,
      );

      expect(newSelection).toEqual(["item_2", "item_3", "item_4"]);
    });

    it("should handle shift+click with reverse range", () => {
      const currentSelection = ["item_4"];

      // Select from item_4 to item_2 (reverse range)
      const newSelection = handleMultiSelect(
        currentSelection,
        "item_2",
        allItems,
        true,
      );

      expect(newSelection).toEqual(["item_2", "item_3", "item_4"]);
    });

    it("should handle empty selection with shift+click", () => {
      const currentSelection = [];

      // Should just select the clicked item
      const newSelection = handleMultiSelect(
        currentSelection,
        "item_3",
        allItems,
        true,
      );

      expect(newSelection).toEqual(["item_3"]);
    });
  });

  describe("Error handling", () => {
    it("should validate inputs for copyWeekToNext", async () => {
      await expect(copyWeekToNext([], mockRepository)).rejects.toThrow(
        "No shifts provided to copy",
      );
      await expect(copyWeekToNext(null, mockRepository)).rejects.toThrow(
        "No shifts provided to copy",
      );
    });

    it("should validate inputs for swapAssignments", async () => {
      await expect(
        swapAssignments("", "assign_2", mockRepository),
      ).rejects.toThrow("Both assignment IDs are required for swap");
      await expect(
        swapAssignments("assign_1", null, mockRepository),
      ).rejects.toThrow("Both assignment IDs are required for swap");
    });

    it("should validate inputs for multiAssignShifts", async () => {
      await expect(
        multiAssignShifts([], "John Doe", mockRepository),
      ).rejects.toThrow("No shift IDs provided for assignment");
      await expect(
        multiAssignShifts(["shift_1"], "", mockRepository),
      ).rejects.toThrow("Disponent name is required for assignment");
    });

    it("should validate inputs for multiUnassignShifts", async () => {
      await expect(multiUnassignShifts([], mockRepository)).rejects.toThrow(
        "No shift IDs provided for unassignment",
      );
      await expect(multiUnassignShifts(null, mockRepository)).rejects.toThrow(
        "No shift IDs provided for unassignment",
      );
    });
  });
});
