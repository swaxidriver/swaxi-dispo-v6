import React, { useState, useCallback } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

import { SHIFT_STATUS, WORK_LOCATIONS } from "../utils/constants";
import { canTransition, STATUS } from "../domain/status";
import { computeDuration } from "../utils/shifts";
import { canManageShifts } from "../lib/rbac";

import ConflictBadge from "./ConflictBadge";

/**
 * Expandable card component for mobile shift display
 * Supports reduced motion and accessibility requirements
 */
function ShiftCard({
  shift,
  auth,
  userRole,
  showActions,
  getStatusBadgeClass,
  onApply,
  onAssign,
  onCancel,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleExpanded();
      }
    },
    [toggleExpanded],
  );

  // Calculate duration
  const duration = computeDuration(shift.start, shift.end);
  const durationHours = Math.floor(duration / 60);
  const durationMinutes = duration % 60;

  // Format date
  const dateString =
    shift.date instanceof Date
      ? shift.date.toLocaleDateString("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        })
      : shift.date;

  return (
    <div
      className="shift-card card mb-4"
      data-testid="shift-card"
      data-shift-id={shift.id}
    >
      {/* Card Header - Always Visible */}
      <div
        className="shift-card-header"
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`shift-details-${shift.id}`}
        aria-label={`${dateString} ${shift.start}-${shift.end} Dienst ${isExpanded ? "zuklappen" : "aufklappen"}`}
        style={{
          cursor: "pointer",
          minHeight: "44px", // Ensure minimum touch target
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-3)",
        }}
      >
        <div className="flex-1">
          <div className="text-sm font-medium text-[var(--color-primary)]">
            {dateString} • {shift.start}-{shift.end}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {durationHours > 0 && `${durationHours}h `}
            {durationMinutes > 0 && `${durationMinutes}m`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={`inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(shift.status)}`}
            style={{
              paddingLeft: "var(--space-2)",
              paddingRight: "var(--space-2)",
            }}
          >
            {shift.status}
          </span>

          {/* Work Location Badge */}
          {shift.workLocation === WORK_LOCATIONS.HOME && (
            <span
              className="inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800"
              style={{
                paddingLeft: "var(--space-2)",
                paddingRight: "var(--space-2)",
              }}
            >
              Homeoffice
            </span>
          )}

          {/* Expand/Collapse Icon */}
          <div className="ml-2 flex-shrink-0">
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <div
        id={`shift-details-${shift.id}`}
        className={`shift-card-details ${isExpanded ? "expanded" : "collapsed"}`}
        aria-hidden={!isExpanded}
      >
        <div style={{ padding: "var(--space-3)", paddingTop: "0" }}>
          {/* Assignment Info */}
          {shift.assignedTo && (
            <div className="text-sm text-gray-500 mb-3">
              <strong>Zugewiesen an:</strong> {shift.assignedTo}
            </div>
          )}

          {/* Conflicts */}
          {shift.conflicts?.length > 0 && (
            <div className="mb-3">
              <ConflictBadge conflicts={shift.conflicts} />
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex flex-col gap-2">
              {shift.status === SHIFT_STATUS.OPEN && (
                <>
                  {(() => {
                    const applyDisabled =
                      !auth?.user || !canTransition(shift.status, STATUS.OPEN);
                    const applyReason = !auth?.user
                      ? "Anmeldung erforderlich"
                      : !canTransition(shift.status, STATUS.OPEN)
                        ? "Status erlaubt keine Bewerbung"
                        : "Für diesen Dienst bewerben";
                    return (
                      <button
                        disabled={applyDisabled}
                        onClick={() => !applyDisabled && onApply(shift.id)}
                        className={`w-full inline-flex items-center justify-center rounded-md text-sm font-semibold shadow-sm ${
                          applyDisabled
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "btn-primary"
                        }`}
                        title={applyReason}
                        aria-label={applyReason}
                        aria-disabled={applyDisabled}
                        style={{
                          minHeight: "44px",
                          paddingLeft: "var(--space-3)",
                          paddingRight: "var(--space-3)",
                          paddingTop: "var(--space-2)",
                          paddingBottom: "var(--space-2)",
                        }}
                      >
                        Bewerben
                      </button>
                    );
                  })()}
                  {canManageShifts(userRole) &&
                    (() => {
                      const assignDisabled = !canTransition(
                        shift.status,
                        STATUS.ASSIGNED,
                      );
                      const assignReason = assignDisabled
                        ? "Status erlaubt keine Zuweisung"
                        : "Diesen Dienst einem Nutzer zuweisen";
                      return (
                        <button
                          disabled={assignDisabled}
                          onClick={() => !assignDisabled && onAssign(shift.id)}
                          className={`w-full inline-flex items-center justify-center rounded-md text-sm font-semibold shadow-sm ring-1 ring-inset ${
                            assignDisabled
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed ring-gray-200"
                              : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
                          }`}
                          title={assignReason}
                          aria-label={assignReason}
                          aria-disabled={assignDisabled}
                          style={{
                            minHeight: "44px",
                            paddingLeft: "var(--space-3)",
                            paddingRight: "var(--space-3)",
                            paddingTop: "var(--space-2)",
                            paddingBottom: "var(--space-2)",
                          }}
                        >
                          Zuweisen
                        </button>
                      );
                    })()}
                </>
              )}
              {shift.status === SHIFT_STATUS.ASSIGNED &&
                canManageShifts(userRole) &&
                (() => {
                  const cancelDisabled = !canTransition(
                    shift.status,
                    STATUS.CANCELLED,
                  );
                  const cancelReason = cancelDisabled
                    ? "Status erlaubt keine Absage"
                    : "Zuweisung für diesen Dienst zurücknehmen";
                  return (
                    <button
                      disabled={cancelDisabled}
                      onClick={() => !cancelDisabled && onCancel(shift.id)}
                      className={`w-full inline-flex items-center justify-center rounded-md text-sm font-semibold shadow-sm ${
                        cancelDisabled
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-500"
                      }`}
                      title={cancelReason}
                      aria-label={cancelReason}
                      aria-disabled={cancelDisabled}
                      style={{
                        minHeight: "44px",
                        paddingLeft: "var(--space-3)",
                        paddingRight: "var(--space-3)",
                        paddingTop: "var(--space-2)",
                        paddingBottom: "var(--space-2)",
                      }}
                    >
                      Absagen
                    </button>
                  );
                })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShiftCard;
