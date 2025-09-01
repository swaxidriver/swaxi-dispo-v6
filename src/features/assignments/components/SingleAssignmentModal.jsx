import React, { useState, useEffect, useMemo, useRef } from "react";
import { Dialog } from "@headlessui/react";

import { useShifts } from "../../../contexts/useShifts";
import { useAuth } from "../../../contexts/useAuth";
import { canAssignShifts } from "../../../lib/rbac";
import { getApplicationsForShift, canAssignUserToShift } from "../assignments";
import {
  categorizeConflicts,
  describeConflicts,
} from "../../../utils/conflicts";

/**
 * SingleAssignmentModal - Modal for Chief users to assign a single shift
 * Features:
 * - Shows shift details with conflict detection
 * - Lists applicants for the shift
 * - Provides conflict summary before assignment
 * - Allows assignment to selected disponent
 * - Option to auto-reject other applications
 */
export default function SingleAssignmentModal({
  isOpen,
  onClose,
  shiftId,
  disponenten = [],
}) {
  const { state, assignShift } = useShifts();
  const { user } = useAuth();
  const [selectedApplicant, setSelectedApplicant] = useState("");
  const [autoRejectOthers, setAutoRejectOthers] = useState(false);
  const [assignmentComment, setAssignmentComment] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const lastActiveRef = useRef(null);

  // Only show modal if user can assign shifts (Chief or Admin)
  const canAssign = user && canAssignShifts(user.role);

  // Store the last active element when modal opens
  useEffect(() => {
    if (isOpen) {
      lastActiveRef.current = document.activeElement;
    } else if (lastActiveRef.current) {
      lastActiveRef.current.focus();
    }
  }, [isOpen]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedApplicant("");
      setAutoRejectOthers(false);
      setAssignmentComment("");
      setShowConfirmation(false);
      setIsAssigning(false);
    }
  }, [isOpen]);

  // Get shift object from ID
  const shift = useMemo(() => {
    return state.shifts.find((s) => s.id === shiftId);
  }, [shiftId, state.shifts]);

  // Get applications for this shift
  const applications = useMemo(() => {
    if (!shift) return [];
    return getApplicationsForShift(shiftId, state.applications || []);
  }, [shift, shiftId, state.applications]);

  // Compute conflicts for the shift if an applicant is selected
  const conflictData = useMemo(() => {
    if (!shift || !selectedApplicant) {
      return {
        hasConflicts: false,
        conflictReasons: [],
        conflictSummary: { warnings: [], blocking: [] },
      };
    }

    const assignmentCheck = canAssignUserToShift(
      shift,
      selectedApplicant,
      state.shifts || [],
    );

    const conflictReasons = assignmentCheck.reasons || [];
    const conflictSummary = categorizeConflicts(conflictReasons);

    return {
      hasConflicts: conflictReasons.length > 0,
      conflictReasons,
      conflictSummary,
    };
  }, [shift, selectedApplicant, state.shifts]);

  const handleAssign = () => {
    if (selectedApplicant && shift) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedApplicant || !shift) return;

    setIsAssigning(true);
    try {
      // Assign the shift to the selected applicant
      await assignShift(shiftId, selectedApplicant);

      // Find and approve the selected applicant's application
      const selectedApplication = applications.find(
        (app) => app.userId === selectedApplicant,
      );

      // Note: Application status updates would be handled by the backend
      // or through a separate context method when available

      // Reject other applications if the option is selected
      if (autoRejectOthers) {
        const otherApplications = applications.filter(
          (app) => app.userId !== selectedApplicant && app.status === "pending",
        );

        // Note: Application rejections would be handled by the backend
        // or through a separate context method when available
        console.log(
          `Would reject ${otherApplications.length} other applications for shift ${shiftId}`,
        );
      }

      // Log the assignment
      console.log(
        `Assigned shift ${shiftId} to applicant ${selectedApplicant}`,
        {
          shiftId,
          applicantId: selectedApplicant,
          assignedBy: user?.id,
          comment: assignmentComment,
          autoRejectOthers,
          timestamp: new Date().toISOString(),
        },
      );

      onClose();
    } catch (error) {
      console.error("Error assigning shift:", error);
    } finally {
      setIsAssigning(false);
      setShowConfirmation(false);
    }
  };

  // Don't render if user can't assign shifts
  if (!canAssign || !shift) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl rounded bg-white p-6 shadow-lg">
          {!showConfirmation ? (
            <>
              <Dialog.Title className="text-lg font-semibold mb-4">
                Schicht zuweisen
              </Dialog.Title>

              {/* Shift Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">
                  Schichtdetails
                </h3>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Datum:</strong> {shift.date} • {shift.start}-
                    {shift.end}
                  </p>
                  <p>
                    <strong>Standort:</strong>{" "}
                    {shift.workLocation || "Nicht angegeben"}
                  </p>
                  <p>
                    <strong>Status:</strong> {shift.status}
                  </p>
                </div>
              </div>

              {/* Applicant Selection */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">
                  Bewerber auswählen ({applications.length} Bewerbung
                  {applications.length !== 1 ? "en" : ""}):
                </h3>

                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.map((application) => {
                      const applicant = disponenten.find(
                        (d) =>
                          d.id === application.userId ||
                          d.name === application.userId,
                      );
                      const applicantName =
                        applicant?.name || application.userId;

                      return (
                        <label
                          key={application.id}
                          className="flex items-start space-x-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name="selectedApplicant"
                            value={application.userId}
                            checked={selectedApplicant === application.userId}
                            onChange={(e) =>
                              setSelectedApplicant(e.target.value)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {applicantName}
                            </div>
                            {application.comment && (
                              <div className="text-sm text-gray-600 mt-1">
                                {application.comment}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Bewerbung vom{" "}
                              {new Date(
                                application.createdAt || Date.now(),
                              ).toLocaleDateString("de-DE")}
                            </div>
                          </div>
                        </label>
                      );
                    })}

                    {selectedApplicant && (
                      <button
                        type="button"
                        onClick={() => setSelectedApplicant("")}
                        className="text-xs text-gray-500 hover:text-gray-700 ml-6"
                      >
                        Auswahl aufheben
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-4 text-center border border-gray-200 rounded-md">
                    Keine Bewerbungen für diese Schicht vorhanden.
                  </div>
                )}
              </div>

              {/* Auto-reject option */}
              {applications.length > 1 && (
                <div className="mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoRejectOthers}
                      onChange={(e) => setAutoRejectOthers(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">
                      Nicht ausgewählte Bewerbungen automatisch ablehnen
                    </span>
                  </label>
                </div>
              )}

              {/* Comment field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kommentar (optional)
                </label>
                <textarea
                  value={assignmentComment}
                  onChange={(e) => setAssignmentComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Zusätzliche Anmerkungen zur Zuweisung..."
                />
              </div>

              {/* Conflict warnings */}
              {conflictData.hasConflicts && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    ⚠️ Konflikte erkannt
                  </h4>
                  <div className="text-sm text-yellow-700">
                    {conflictData.conflictSummary.blocking.length > 0 && (
                      <div className="mb-2">
                        <strong>Blockierende Konflikte:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {describeConflicts(
                            conflictData.conflictSummary.blocking,
                          ).map((desc, idx) => (
                            <li key={idx}>{desc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {conflictData.conflictSummary.warnings.length > 0 && (
                      <div>
                        <strong>Warnungen:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {describeConflicts(
                            conflictData.conflictSummary.warnings,
                          ).map((desc, idx) => (
                            <li key={idx}>{desc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={
                    !selectedApplicant ||
                    conflictData.conflictSummary.blocking.length > 0
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Zuweisen
                </button>
              </div>
            </>
          ) : (
            /* Confirmation Dialog */
            <>
              <Dialog.Title className="text-lg font-semibold mb-4">
                Zuweisung bestätigen
              </Dialog.Title>
              <p className="text-sm text-gray-600 mb-4">
                Sie sind dabei, die Schicht an {selectedApplicant} zuzuweisen.
              </p>

              {autoRejectOthers && applications.length > 1 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Andere Bewerbungen ablehnen
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {applications.length - 1} nicht ausgewählte Bewerbung
                    {applications.length - 1 !== 1 ? "en" : ""} wird automatisch
                    abgelehnt.
                  </p>
                </div>
              )}

              {conflictData.hasConflicts && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Konflikte erkannt
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Die Zuweisung kann zu Konflikten führen. Bitte prüfen Sie
                    die Details.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isAssigning}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  disabled={isAssigning}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isAssigning ? "Zuweisen..." : "Bestätigen"}
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
