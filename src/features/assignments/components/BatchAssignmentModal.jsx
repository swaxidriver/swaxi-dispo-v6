import { useState, useRef, useEffect, useMemo } from "react";
import { Dialog } from "@headlessui/react";

import { useShifts } from "../../../contexts/useShifts";
import { useAuth } from "../../../contexts/useAuth";
import { canAssignShifts } from "../../../utils/constants";
import { computeShiftConflicts } from "../../../utils/shifts";
import {
  describeConflicts,
  categorizeConflicts,
} from "../../../utils/conflicts";
import { getApplicationsForShift } from "../assignments";

/**
 * BatchAssignmentModal - Modal for Chief users to assign multiple shifts in batch
 * Features:
 * - Shows selected shifts with conflict detection
 * - Lists applicants for each shift
 * - Provides conflict summary before assignment
 * - Allows assignment to multiple disponenten
 */
export default function BatchAssignmentModal({
  isOpen,
  onClose,
  selectedShifts = [],
  disponenten = [],
}) {
  const { state, assignShift } = useShifts();
  const { user } = useAuth();
  const [selectedDisponent, setSelectedDisponent] = useState("");
  const [assignmentComment, setAssignmentComment] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const lastActiveRef = useRef(null);

  // Only show modal if user can assign shifts (Chief or Admin)
  const canAssign = user && canAssignShifts(user.role);

  // Restore focus when modal opens
  useEffect(() => {
    if (isOpen) {
      lastActiveRef.current = document.activeElement;
      setTimeout(() => {
        const firstFocusable = document.querySelector("[data-focus-first]");
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }, 0);
    } else if (lastActiveRef.current) {
      setTimeout(() => {
        if (lastActiveRef.current) {
          lastActiveRef.current.focus();
        }
      }, 0);
    }
  }, [isOpen]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDisponent("");
      setAssignmentComment("");
      setShowConfirmation(false);
      setIsAssigning(false);
    }
  }, [isOpen]);

  // Get shift objects from selected IDs
  const shifts = useMemo(() => {
    return selectedShifts
      .map((id) => state.shifts.find((shift) => shift.id === id))
      .filter(Boolean);
  }, [selectedShifts, state.shifts]);

  // Compute conflicts for selected shifts
  const conflictData = useMemo(() => {
    if (!shifts.length) {
      return {
        hasConflicts: false,
        conflictsByShift: {},
        allConflictReasons: [],
        conflictSummary: { warnings: [], blocking: [] },
      };
    }

    const conflictsByShift = {};
    const allConflictReasons = new Set();

    shifts.forEach((shift) => {
      // Check conflicts against other selected shifts and existing assignments
      const otherShifts = shifts.filter((s) => s.id !== shift.id);
      const existingShifts = state.shifts.filter((s) => s.id !== shift.id);

      if (otherShifts.length > 0) {
        const conflicts = computeShiftConflicts(
          shift,
          otherShifts,
          state.applications || [],
        );

        if (conflicts.length > 0) {
          conflictsByShift[shift.id] = conflicts;
          conflicts.forEach((c) => allConflictReasons.add(c));
        }
      }
    });

    const allConflictCodes = Array.from(allConflictReasons);
    const conflictSummary = categorizeConflicts(allConflictCodes);

    return {
      hasConflicts: Object.keys(conflictsByShift).length > 0,
      conflictsByShift,
      allConflictReasons: allConflictCodes,
      conflictSummary,
    };
  }, [shifts, state.shifts, state.applications]);

  // Get applicants for each shift
  const shiftApplicants = useMemo(() => {
    const applicants = {};
    shifts.forEach((shift) => {
      const shiftApplications = getApplicationsForShift(
        shift.id,
        state.applications || [],
      );
      applicants[shift.id] = shiftApplications.map((app) => {
        // Find user details (in a real app, this would come from a users context)
        return {
          id: app.userId,
          name: app.userId, // Simplified - would be actual user name
          appliedAt: app.appliedAt,
          status: app.status,
        };
      });
    });
    return applicants;
  }, [shifts, state.applications]);

  const handleAssign = () => {
    if (selectedDisponent && shifts.length > 0) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedDisponent || shifts.length === 0) return;

    setIsAssigning(true);
    try {
      // Assign all selected shifts to the chosen disponent
      for (const shift of shifts) {
        await assignShift(shift.id, selectedDisponent);
      }

      // Log the batch assignment
      console.log(
        `Batch assigned ${shifts.length} shifts to ${selectedDisponent}`,
        {
          shifts: shifts.map((s) => s.id),
          assignedBy: user?.id,
          comment: assignmentComment,
          timestamp: new Date().toISOString(),
        },
      );

      onClose();
    } catch (error) {
      console.error("Failed to assign shifts:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  if (!canAssign) {
    return null;
  }

  if (showConfirmation) {
    return (
      <Dialog
        open={isOpen}
        onClose={() => setShowConfirmation(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Sammelzuweisung bestätigen
            </Dialog.Title>
            <p className="text-sm text-gray-600 mb-4">
              Sie sind dabei, {shifts.length} Schicht
              {shifts.length > 1 ? "en" : ""} an{" "}
              <strong>{selectedDisponent}</strong> zuzuweisen.
            </p>
            {conflictData.hasConflicts && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Konflikte erkannt
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Die Zuweisung wird trotz erkannter Konflikte durchgeführt.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                disabled={isAssigning}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? "Zuweisen..." : "Bestätigen"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold">
              Sammelzuweisung ({shifts.length} Schicht
              {shifts.length > 1 ? "en" : ""})
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md"
              aria-label="Schließen"
            >
              <span className="sr-only">Schließen</span>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Disponent Selection */}
            <div className="mb-6">
              <label
                htmlFor="disponent-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Disponent auswählen
              </label>
              <select
                id="disponent-select"
                data-focus-first
                value={selectedDisponent}
                onChange={(e) => setSelectedDisponent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Disponent auswählen --</option>
                {disponenten.map((disp) => (
                  <option key={disp.id} value={disp.name}>
                    {disp.name} ({disp.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Comment */}
            <div className="mb-6">
              <label
                htmlFor="assignment-comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Kommentar (optional)
              </label>
              <textarea
                id="assignment-comment"
                value={assignmentComment}
                onChange={(e) => setAssignmentComment(e.target.value)}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Zusätzliche Informationen zur Zuweisung..."
              />
            </div>

            {/* Conflict Summary */}
            {conflictData.hasConflicts && (
              <div className="mb-6 border border-red-200 bg-red-50 rounded-md p-4">
                <div className="text-sm font-medium text-red-600 mb-2">
                  ⚠️ Konflikte erkannt
                </div>
                <div className="space-y-2">
                  {conflictData.conflictSummary.blocking.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600">
                        Blockierende Konflikte:
                      </p>
                      <ul className="text-xs text-red-500 ml-2">
                        {describeConflicts(
                          conflictData.conflictSummary.blocking,
                        ).map((desc, i) => (
                          <li key={i}>• {desc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {conflictData.conflictSummary.warnings.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-yellow-600">
                        Warnungen:
                      </p>
                      <ul className="text-xs text-yellow-500 ml-2">
                        {describeConflicts(
                          conflictData.conflictSummary.warnings,
                        ).map((desc, i) => (
                          <li key={i}>• {desc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Shifts with Applicants */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                Ausgewählte Schichten
              </h3>
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {shift.date} • {shift.type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shift.start}-{shift.end} • {shift.workLocation}
                      </div>
                    </div>
                    {conflictData.conflictsByShift[shift.id] && (
                      <div className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                        Konflikt
                      </div>
                    )}
                  </div>

                  {/* Applicants for this shift */}
                  {shiftApplicants[shift.id] &&
                    shiftApplicants[shift.id].length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          Bewerber ({shiftApplicants[shift.id].length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {shiftApplicants[shift.id].map((applicant) => (
                            <span
                              key={applicant.id}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                            >
                              {applicant.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedDisponent || shifts.length === 0}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {shifts.length} Schicht{shifts.length > 1 ? "en" : ""} zuweisen
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
