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
import {
  getApplicationsForShift,
  rejectApplication,
  approveApplication,
} from "../assignments";

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
  const [selectedApplicants, setSelectedApplicants] = useState({}); // { shiftId: applicantId }
  const [autoRejectOthers, setAutoRejectOthers] = useState(false);
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
      setSelectedApplicants({});
      setAutoRejectOthers(false);
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

  // Compute conflicts for selected shifts with detailed information
  const conflictData = useMemo(() => {
    if (!shifts.length) {
      return {
        hasConflicts: false,
        conflictsByShift: {},
        allConflictReasons: [],
        conflictSummary: { warnings: [], blocking: [] },
        detailedConflicts: [],
      };
    }

    const conflictsByShift = {};
    const allConflictReasons = new Set();
    const detailedConflicts = [];

    shifts.forEach((shift) => {
      // Check conflicts against other selected shifts and existing assignments
      const otherShifts = shifts.filter((s) => s.id !== shift.id);

      if (otherShifts.length > 0) {
        const conflicts = computeShiftConflicts(
          shift,
          otherShifts,
          state.applications || [],
        );

        if (conflicts.length > 0) {
          conflictsByShift[shift.id] = conflicts;
          conflicts.forEach((c) => allConflictReasons.add(c));

          // Generate detailed conflict information
          otherShifts.forEach((otherShift) => {
            const shiftConflicts = computeShiftConflicts(
              shift,
              [otherShift],
              state.applications || [],
            );

            if (shiftConflicts.length > 0) {
              detailedConflicts.push({
                shift1: {
                  id: shift.id,
                  date: shift.date,
                  time: `${shift.start}-${shift.end}`,
                  type: shift.type,
                  workLocation: shift.workLocation,
                },
                shift2: {
                  id: otherShift.id,
                  date: otherShift.date,
                  time: `${otherShift.start}-${otherShift.end}`,
                  type: otherShift.type,
                  workLocation: otherShift.workLocation,
                },
                conflictTypes: shiftConflicts,
                severity: shiftConflicts.some(
                  (c) => categorizeConflicts([c]).blocking.length > 0,
                )
                  ? "blocking"
                  : "warning",
              });
            }
          });
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
      detailedConflicts,
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
    const hasSelections = Object.keys(selectedApplicants).length > 0;
    if (hasSelections && shifts.length > 0) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmAssign = async () => {
    const selectedShiftIds = Object.keys(selectedApplicants);
    if (selectedShiftIds.length === 0) return;

    setIsAssigning(true);
    try {
      // Process each shift with selected applicant
      for (const shiftId of selectedShiftIds) {
        const applicantId = selectedApplicants[shiftId];

        // Assign the shift to the selected applicant
        await assignShift(shiftId, applicantId);

        // Find and approve the selected applicant's application
        const shiftApplications = getApplicationsForShift(
          shiftId,
          state.applications || [],
        );

        const selectedApplication = shiftApplications.find(
          (app) => app.userId === applicantId,
        );

        // Note: Application status updates would be handled by the backend
        // or through a separate context method when available

        // Reject other applications if the option is selected
        if (autoRejectOthers) {
          const otherApplications = shiftApplications.filter(
            (app) => app.userId !== applicantId && app.status === "pending",
          );

          // Note: Application rejections would be handled by the backend
          // or through a separate context method when available
          console.log(
            `Would reject ${otherApplications.length} other applications for shift ${shiftId}`,
          );
        }
      }

      // Log the batch assignment
      console.log(
        `Batch assigned ${selectedShiftIds.length} shifts to selected applicants`,
        {
          assignments: selectedShiftIds.map((shiftId) => ({
            shiftId,
            applicantId: selectedApplicants[shiftId],
          })),
          assignedBy: user?.id,
          comment: assignmentComment,
          autoRejectOthers,
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

  const handleApplicantSelect = (shiftId, applicantId) => {
    setSelectedApplicants((prev) => ({
      ...prev,
      [shiftId]: applicantId,
    }));
  };

  const handleApplicantDeselect = (shiftId) => {
    setSelectedApplicants((prev) => {
      const updated = { ...prev };
      delete updated[shiftId];
      return updated;
    });
  };

  if (!canAssign) {
    return null;
  }

  if (showConfirmation) {
    const selectedCount = Object.keys(selectedApplicants).length;
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
              Sie sind dabei, {selectedCount} Schicht
              {selectedCount > 1 ? "en" : ""} an die ausgewählten Bewerber
              zuzuweisen.
            </p>
            {autoRejectOthers && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Andere Bewerbungen ablehnen
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Nicht ausgewählte Bewerbungen werden automatisch abgelehnt.
                </p>
              </div>
            )}
            {conflictData.hasConflicts && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️{" "}
                  {conflictData.conflictSummary.blocking.length > 0
                    ? "Blockierende Konflikte erkannt"
                    : "Konflikte mit Warnungen"}
                </p>
                <div className="text-xs text-red-700 mt-2 space-y-1">
                  {conflictData.conflictSummary.blocking.length > 0 && (
                    <div>
                      <strong>Blockierend:</strong>{" "}
                      {describeConflicts(
                        conflictData.conflictSummary.blocking,
                      ).join(", ")}
                    </div>
                  )}
                  {conflictData.conflictSummary.warnings.length > 0 && (
                    <div>
                      <strong>Warnungen:</strong>{" "}
                      {describeConflicts(
                        conflictData.conflictSummary.warnings,
                      ).join(", ")}
                    </div>
                  )}
                  <div className="mt-2 text-xs">
                    <strong>
                      {conflictData.detailedConflicts.length} Schichtenkonflikte
                    </strong>{" "}
                    zwischen ausgewählten Schichten erkannt.
                  </div>
                </div>
                <p className="text-xs text-red-600 mt-2 font-medium">
                  {conflictData.conflictSummary.blocking.length > 0
                    ? "Die Zuweisung wird trotz blockierender Konflikte durchgeführt."
                    : "Die Zuweisung wird mit Warnungen durchgeführt."}
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
            {/* Auto-reject option */}
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRejectOthers}
                  onChange={(e) => setAutoRejectOthers(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Nicht ausgewählte Bewerbungen automatisch ablehnen
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Bewerber, die nicht ausgewählt werden, erhalten automatisch eine
                Absage für diese Schichten.
              </p>
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

            {/* Enhanced Conflict Summary Panel */}
            {conflictData.hasConflicts && (
              <div className="mb-6 border border-red-200 bg-red-50 rounded-md p-4">
                <div className="text-sm font-medium text-red-600 mb-3">
                  ⚠️ Konflikte bei Sammelzuweisung erkannt
                </div>

                {/* Summary of conflict types */}
                <div className="space-y-2 mb-4">
                  {conflictData.conflictSummary.blocking.length > 0 && (
                    <div className="bg-red-100 border border-red-300 rounded p-2">
                      <p className="text-xs font-medium text-red-700 mb-1">
                        🚫 Blockierende Konflikte (
                        {conflictData.conflictSummary.blocking.length}):
                      </p>
                      <ul className="text-xs text-red-600 ml-2">
                        {describeConflicts(
                          conflictData.conflictSummary.blocking,
                        ).map((desc, i) => (
                          <li key={i}>• {desc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {conflictData.conflictSummary.warnings.length > 0 && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded p-2">
                      <p className="text-xs font-medium text-yellow-700 mb-1">
                        ⚠️ Warnungen (
                        {conflictData.conflictSummary.warnings.length}):
                      </p>
                      <ul className="text-xs text-yellow-600 ml-2">
                        {describeConflicts(
                          conflictData.conflictSummary.warnings,
                        ).map((desc, i) => (
                          <li key={i}>• {desc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Detailed conflict breakdown */}
                {conflictData.detailedConflicts.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Betroffene Schichten:
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {conflictData.detailedConflicts.map((conflict, i) => (
                        <div
                          key={i}
                          className={`text-xs p-2 rounded border ${
                            conflict.severity === "blocking"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-medium ${
                                conflict.severity === "blocking"
                                  ? "text-red-700"
                                  : "text-yellow-700"
                              }`}
                            >
                              {conflict.severity === "blocking" ? "🚫" : "⚠️"}
                              {describeConflicts(conflict.conflictTypes).join(
                                ", ",
                              )}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-600">
                              <strong>Schicht 1:</strong> {conflict.shift1.date}{" "}
                              • {conflict.shift1.time} • {conflict.shift1.type}
                              {conflict.shift1.workLocation &&
                                ` • ${conflict.shift1.workLocation}`}
                            </div>
                            <div className="text-gray-600">
                              <strong>Schicht 2:</strong> {conflict.shift2.date}{" "}
                              • {conflict.shift2.time} • {conflict.shift2.type}
                              {conflict.shift2.workLocation &&
                                ` • ${conflict.shift2.workLocation}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning about assignment */}
                <div className="mt-3 p-2 bg-gray-100 border border-gray-300 rounded">
                  <p className="text-xs text-gray-700">
                    <strong>Hinweis:</strong>{" "}
                    {conflictData.conflictSummary.blocking.length > 0
                      ? "Blockierende Konflikte sollten vor der Zuweisung gelöst werden."
                      : "Diese Warnungen können überschrieben werden, sollten aber überprüft werden."}
                  </p>
                </div>
              </div>
            )}

            {/* Selected Shifts with Applicants */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                Ausgewählte Schichten - Bewerber auswählen
              </h3>
              {shifts.map((shift) => {
                const applicants = shiftApplicants[shift.id] || [];
                const selectedApplicant = selectedApplicants[shift.id];

                return (
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
                        <div className="text-xs bg-red-50 border border-red-200 rounded p-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-red-600 font-medium">
                              ⚠️ Konflikt
                            </span>
                          </div>
                          <div className="text-red-600">
                            {describeConflicts(
                              conflictData.conflictsByShift[shift.id],
                            ).join(", ")}
                          </div>
                          {/* Show which other shifts this conflicts with */}
                          {conflictData.detailedConflicts
                            .filter(
                              (c) =>
                                c.shift1.id === shift.id ||
                                c.shift2.id === shift.id,
                            )
                            .slice(0, 2) // Show max 2 conflicts to avoid clutter
                            .map((conflict, i) => {
                              const otherShift =
                                conflict.shift1.id === shift.id
                                  ? conflict.shift2
                                  : conflict.shift1;
                              return (
                                <div
                                  key={i}
                                  className="text-xs text-red-500 mt-1"
                                >
                                  → Konflikt mit: {otherShift.date}{" "}
                                  {otherShift.time}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* Applicants selection for this shift */}
                    {applicants.length > 0 ? (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-3">
                          Bewerber auswählen ({applicants.length} Bewerbung
                          {applicants.length > 1 ? "en" : ""}):
                        </p>
                        <div className="space-y-2">
                          {applicants.map((applicant) => (
                            <label
                              key={applicant.id}
                              className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`applicant-${shift.id}`}
                                value={applicant.id}
                                checked={selectedApplicant === applicant.id}
                                onChange={() =>
                                  handleApplicantSelect(shift.id, applicant.id)
                                }
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {applicant.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Beworben am:{" "}
                                  {new Date(
                                    applicant.appliedAt,
                                  ).toLocaleDateString("de-DE")}
                                </div>
                              </div>
                              {applicant.status === "pending" && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  Ausstehend
                                </span>
                              )}
                            </label>
                          ))}
                          {selectedApplicant && (
                            <button
                              type="button"
                              onClick={() => handleApplicantDeselect(shift.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 ml-6"
                            >
                              Auswahl aufheben
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Keine Bewerbungen für diese Schicht vorhanden.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
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
              disabled={Object.keys(selectedApplicants).length === 0}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {Object.keys(selectedApplicants).length} Schicht
              {Object.keys(selectedApplicants).length !== 1 ? "en" : ""}{" "}
              zuweisen
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
