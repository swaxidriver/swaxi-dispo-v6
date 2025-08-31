/**
 * Example integration of bulk operations into the existing assignment interface
 * This demonstrates how the bulk operations can be integrated with the existing
 * assignment-dnd.jsx multi-select functionality
 */

import React, { useState, useCallback } from "react";

import { useShifts } from "../contexts/useShifts";
import { useAuth } from "../hooks/useAuth";

import {
  copyWeekToNext,
  swapAssignments,
  multiAssignShifts,
  multiUnassignShifts,
  handleMultiSelect,
} from "./bulk-operations";

export function BulkOperationsDemo() {
  const { state, repository } = useShifts();
  const { user } = useAuth();
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationResult, setOperationResult] = useState(null);

  const userContext = {
    actor: user?.email || "Demo User",
    role: user?.role || "USER",
  };

  // Handle copy week operation
  const handleCopyWeek = useCallback(async () => {
    if (selectedShifts.length === 0) return;

    setIsProcessing(true);
    try {
      const selectedShiftObjects = selectedShifts
        .map((id) => state.shifts.find((s) => s.id === id))
        .filter(Boolean);

      const copiedShifts = await copyWeekToNext(
        selectedShiftObjects,
        repository,
        userContext,
      );

      setOperationResult({
        type: "success",
        message: `Successfully copied ${copiedShifts.length} shifts to next week`,
        details: copiedShifts,
      });

      setSelectedShifts([]); // Clear selection
    } catch (error) {
      setOperationResult({
        type: "error",
        message: `Failed to copy week: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedShifts, state.shifts, repository, userContext]);

  // Handle multi-assign operation
  const handleMultiAssign = useCallback(
    async (disponentName) => {
      if (selectedShifts.length === 0) return;

      setIsProcessing(true);
      try {
        const result = await multiAssignShifts(
          selectedShifts,
          disponentName,
          repository,
          userContext,
        );

        setOperationResult({
          type: "success",
          message: `Successfully assigned ${result.assignments.length} shifts to ${disponentName}`,
          details: result,
        });

        if (result.failures.length > 0) {
          setOperationResult((prev) => ({
            ...prev,
            type: "warning",
            message: `${prev.message}. ${result.failures.length} assignments failed.`,
          }));
        }

        setSelectedShifts([]); // Clear selection
      } catch (error) {
        setOperationResult({
          type: "error",
          message: `Failed to assign shifts: ${error.message}`,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedShifts, repository, userContext],
  );

  // Handle multi-unassign operation
  const handleMultiUnassign = useCallback(async () => {
    if (selectedShifts.length === 0) return;

    setIsProcessing(true);
    try {
      const result = await multiUnassignShifts(
        selectedShifts,
        repository,
        userContext,
      );

      setOperationResult({
        type: "success",
        message: `Successfully unassigned ${result.unassignments.length} shifts`,
        details: result,
      });

      setSelectedShifts([]); // Clear selection
    } catch (error) {
      setOperationResult({
        type: "error",
        message: `Failed to unassign shifts: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedShifts, repository, userContext]);

  // Handle shift selection with enhanced multi-select (shift+click support)
  const handleShiftClick = useCallback(
    (shiftId, event) => {
      const isShiftClick = event.shiftKey;
      const isCtrlClick = event.ctrlKey || event.metaKey;

      const newSelection = handleMultiSelect(
        selectedShifts,
        shiftId,
        state.shifts,
        isShiftClick,
        isCtrlClick,
      );

      setSelectedShifts(newSelection);
    },
    [selectedShifts, state.shifts],
  );

  // Example swap operation (would typically be triggered by drag-and-drop or button)
  const handleSwapDemo = useCallback(async () => {
    // This is a demo - in real usage, you'd have two specific assignments to swap
    if (selectedShifts.length < 2) {
      setOperationResult({
        type: "error",
        message: "Please select at least 2 shifts to demonstrate swap",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Mock assignment IDs for demo - in real app these would come from the UI
      const assignmentId1 = `assignment_${selectedShifts[0]}`;
      const assignmentId2 = `assignment_${selectedShifts[1]}`;

      await swapAssignments(
        assignmentId1,
        assignmentId2,
        repository,
        userContext,
      );

      setOperationResult({
        type: "success",
        message: `Successfully swapped assignments between ${selectedShifts[0]} and ${selectedShifts[1]}`,
        details: { swapped: [assignmentId1, assignmentId2] },
      });
    } catch (error) {
      setOperationResult({
        type: "error",
        message: `Failed to swap assignments: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedShifts, repository, userContext]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Bulk Operations Demo</h2>

      {/* Selection Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Multi-Select Instructions:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Click to select individual shifts</li>
          <li>• Ctrl/Cmd+Click to toggle selection</li>
          <li>• Shift+Click to select range</li>
          <li>• {selectedShifts.length} shifts currently selected</li>
        </ul>
      </div>

      {/* Bulk Operation Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleCopyWeek}
          disabled={selectedShifts.length === 0 || isProcessing}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
        >
          Copy Week to Next Week
        </button>

        <button
          onClick={() => handleMultiAssign("John Doe")}
          disabled={selectedShifts.length === 0 || isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          Assign to John Doe
        </button>

        <button
          onClick={handleMultiUnassign}
          disabled={selectedShifts.length === 0 || isProcessing}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
        >
          Unassign Selected
        </button>

        <button
          onClick={handleSwapDemo}
          disabled={selectedShifts.length < 2 || isProcessing}
          className="px-4 py-2 bg-purple-600 text-white rounded disabled:bg-gray-400"
        >
          Demo Swap (2+ selected)
        </button>
      </div>

      {/* Operation Result */}
      {operationResult && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            operationResult.type === "success"
              ? "bg-green-50 text-green-700"
              : operationResult.type === "warning"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          <p className="font-semibold">{operationResult.message}</p>
          {operationResult.details && (
            <details className="mt-2">
              <summary className="cursor-pointer">View Details</summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(operationResult.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Shift List with Multi-Select */}
      <div className="space-y-2">
        <h3 className="font-semibold">Available Shifts (Click to select):</h3>
        {state.shifts.slice(0, 10).map((shift) => (
          <div
            key={shift.id}
            onClick={(e) => handleShiftClick(shift.id, e)}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selectedShifts.includes(shift.id)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{shift.type}</span>
                <span className="text-gray-500 ml-2">{shift.date}</span>
                <span className="text-gray-500 ml-2">
                  {shift.start}-{shift.end}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {shift.assignedTo || "Unassigned"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <p>Processing bulk operation...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkOperationsDemo;
