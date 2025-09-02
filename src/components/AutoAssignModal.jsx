import { useState, useEffect, useRef } from "react";
import { Dialog } from "@headlessui/react";

import { useI18n } from "../hooks/useI18n";

/**
 * AutoAssignModal - Confirmation modal for auto-assignment with preview
 * Features:
 * - Shows assignment rules explanation
 * - Displays preview of planned assignments
 * - Provides abort/confirm options
 * - Detects conflicts in planned assignments
 */
export default function AutoAssignModal({
  isOpen,
  onClose,
  onConfirm,
  plannedAssignments = [],
  isProcessing = false,
}) {
  const { t } = useI18n();
  const [isConfirming, setIsConfirming] = useState(false);
  const lastActiveRef = useRef(null);

  // Focus management: save last active element when modal opens, restore when closes
  useEffect(() => {
    if (isOpen) {
      lastActiveRef.current = document.activeElement;
    }
    if (!isOpen && lastActiveRef.current) {
      // Use setTimeout to ensure focus after modal unmount
      setTimeout(() => {
        if (
          lastActiveRef.current &&
          typeof lastActiveRef.current.focus === "function"
        ) {
          lastActiveRef.current.focus();
        }
      }, 0);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsConfirming(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Auto-assignment failed:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && !isConfirming && !isProcessing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasAssignments = plannedAssignments.length > 0;
  const conflictedAssignments = plannedAssignments.filter(
    (assignment) => assignment.hasConflicts,
  );
  const hasConflicts = conflictedAssignments.length > 0;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        onKeyDown={handleKeyDown}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Automatische Zuteilung
            </Dialog.Title>

            {/* Rules explanation */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Zuweisungsregeln:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Offene Schichten werden automatisch verfügbaren Disponenten
                  zugewiesen
                </li>
                <li>• Berücksichtigung von Zeitkonflikten und Verfügbarkeit</li>
                <li>
                  • Faire Verteilung basierend auf aktueller Arbeitsbelastung
                </li>
                <li>
                  • Bevorzugung von Disponenten mit passenden Qualifikationen
                </li>
              </ul>
            </div>

            {/* Assignment preview */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Geplante Zuweisungen:
              </h3>

              {!hasAssignments ? (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Keine automatischen Zuweisungen möglich. Alle geeigneten
                    Schichten sind bereits zugewiesen oder es sind keine
                    verfügbaren Disponenten vorhanden.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plannedAssignments.map((assignment, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        assignment.hasConflicts
                          ? "bg-red-50 border-red-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {assignment.shift.date} - {assignment.shift.start}{" "}
                            bis {assignment.shift.end}
                          </p>
                          {assignment.shift.type && (
                            <p className="text-xs text-gray-600">
                              {assignment.shift.type}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            → {assignment.disponent.name}
                          </p>
                          {assignment.hasConflicts && (
                            <p className="text-xs text-red-600">
                              ⚠️ Konflikt erkannt
                            </p>
                          )}
                        </div>
                      </div>
                      {assignment.hasConflicts &&
                        assignment.conflictReasons && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                            <strong>Konflikte:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {assignment.conflictReasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conflict warning */}
            {hasConflicts && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <div className="text-yellow-600 mr-2">⚠️</div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">
                      Konflikte erkannt
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {conflictedAssignments.length} von{" "}
                      {plannedAssignments.length} Zuweisungen haben Konflikte.
                      Die automatische Zuteilung wird trotz erkannter Konflikte
                      durchgeführt, wenn Sie fortfahren.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isConfirming || isProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming || isProcessing || !hasAssignments}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isConfirming || isProcessing
                  ? "Zuweisen..."
                  : hasAssignments
                    ? `${plannedAssignments.length} Zuweisung${plannedAssignments.length !== 1 ? "en" : ""} bestätigen`
                    : "Keine Zuweisungen möglich"}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
