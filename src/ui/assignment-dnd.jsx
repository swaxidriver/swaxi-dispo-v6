import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";

import { useShifts } from "../contexts/useShifts";
import { useAuth } from "../contexts/useAuth";
import {
  SHIFT_STATUS,
  WORK_LOCATIONS,
  canAssignShifts,
} from "../utils/constants";
import { BatchAssignmentModal } from "../features/assignments";

import { dragDropAria, keyboardNav, LiveRegion } from "./accessibility";

// Sample disponenten data - in a real app this would come from a context or API
const SAMPLE_DISPONENTEN = [
  {
    id: "disp_1",
    name: "Anna Schmidt",
    role: "analyst",
    availability: "available",
    email: "anna.schmidt@example.com",
  },
  {
    id: "disp_2",
    name: "Max Weber",
    role: "manager",
    availability: "available",
    email: "max.weber@example.com",
  },
  {
    id: "disp_3",
    name: "Lisa Müller",
    role: "analyst",
    availability: "busy",
    email: "lisa.mueller@example.com",
  },
  {
    id: "disp_4",
    name: "Tom Fischer",
    role: "senior",
    availability: "available",
    email: "tom.fischer@example.com",
  },
  {
    id: "disp_5",
    name: "Sara Klein",
    role: "analyst",
    availability: "available",
    email: "sara.klein@example.com",
  },
];

const ROLE_OPTIONS = ["all", "analyst", "manager", "senior"];
const AVAILABILITY_OPTIONS = ["all", "available", "busy"];

export default function AssignmentDragDrop() {
  const { state, assignShift } = useShifts();
  const { user } = useAuth();
  const [draggedShift, setDraggedShift] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);
  const [selectedShifts, setSelectedShifts] = useState(new Set());
  const [roleFilter, setRoleFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [focusedShift] = useState(null);
  const [focusedDisponent] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState(false); // Keyboard assignment mode
  const [showBatchModal, setShowBatchModal] = useState(false);

  const shiftsRef = useRef(null);
  const disponentiRef = useRef(null);
  const liveRegionRef = useRef(null);

  // Check if user can assign shifts (Chief or Admin)
  const canAssign = user && canAssignShifts(user.role);

  // Initialize live region for announcements
  useEffect(() => {
    liveRegionRef.current = new LiveRegion("polite");
    return () => {
      if (liveRegionRef.current) {
        liveRegionRef.current.destroy();
      }
    };
  }, []);

  // Filter unassigned shifts
  const unassignedShifts = useMemo(
    () =>
      state.shifts.filter(
        (shift) => shift.status === SHIFT_STATUS.OPEN || !shift.assignedTo,
      ),
    [state.shifts],
  );

  // Filter disponenten based on filters
  const filteredDisponenten = useMemo(
    () =>
      SAMPLE_DISPONENTEN.filter((disp) => {
        if (roleFilter !== "all" && disp.role !== roleFilter) return false;
        if (
          availabilityFilter !== "all" &&
          disp.availability !== availabilityFilter
        )
          return false;
        return true;
      }),
    [roleFilter, availabilityFilter],
  );

  // Drag handlers for shifts
  const handleShiftDragStart = useCallback((e, shift) => {
    setDraggedShift(shift);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", shift.id);

    // Visual feedback
    e.target.style.opacity = "0.5";

    // ARIA feedback
    dragDropAria.setDragState(e.target, true, true);
    if (liveRegionRef.current) {
      liveRegionRef.current.announce(
        `Schicht ${shift.id} wird gezogen. Navigieren Sie zu einem Disponenten und lassen Sie los.`,
      );
    }
  }, []);

  const handleShiftDragEnd = useCallback((e) => {
    setDraggedShift(null);
    setDraggedOver(null);
    e.target.style.opacity = "1";

    // Reset ARIA state
    dragDropAria.setDragState(e.target, false, false);
  }, []);

  // Drop handlers for disponenten
  const handleDisponentDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDisponentDragEnter = useCallback((e, disp) => {
    e.preventDefault();
    setDraggedOver(disp.id);

    // Update ARIA state for drop zone
    dragDropAria.setDropZoneState(e.currentTarget, true, true);
  }, []);

  const handleDisponentDragLeave = useCallback((e) => {
    // Only clear if leaving the actual drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOver(null);
      dragDropAria.setDropZoneState(e.currentTarget, true, false);
    }
  }, []);

  const handleDisponentDrop = useCallback(
    (e, disp) => {
      e.preventDefault();
      setDraggedOver(null);

      const shiftId = e.dataTransfer.getData("text/plain");
      if (shiftId && draggedShift) {
        assignShift(shiftId, disp.name);
        setDraggedShift(null);

        // Announce successful assignment
        if (liveRegionRef.current) {
          liveRegionRef.current.announce(
            `Schicht ${shiftId} wurde erfolgreich ${disp.name} zugewiesen.`,
          );
        }
      }

      // Reset ARIA state
      dragDropAria.setDropZoneState(e.currentTarget, false, false);
    },
    [draggedShift, assignShift],
  );

  // Enhanced keyboard navigation for shifts
  const handleShiftKeyDown = useCallback(
    (e, shift) => {
      const shiftsContainer = shiftsRef.current;
      if (!shiftsContainer) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (assignmentMode) {
            // In assignment mode, toggle selection
            if (selectedShifts.has(shift.id)) {
              setSelectedShifts((prev) => {
                const next = new Set(prev);
                next.delete(shift.id);
                return next;
              });
              if (liveRegionRef.current) {
                liveRegionRef.current.announce(
                  `Schicht ${shift.id} abgewählt.`,
                );
              }
            } else {
              setSelectedShifts((prev) => new Set([...prev, shift.id]));
              if (liveRegionRef.current) {
                liveRegionRef.current.announce(
                  `Schicht ${shift.id} ausgewählt.`,
                );
              }
            }
          } else {
            // Single selection for immediate assignment
            setSelectedShifts(new Set([shift.id]));
            setAssignmentMode(true);
            if (liveRegionRef.current) {
              liveRegionRef.current.announce(
                `Zuweisungsmodus aktiviert. Schicht ${shift.id} ausgewählt. Navigieren Sie zu einem Disponenten.`,
              );
            }
          }
          break;
        case "ArrowDown":
        case "ArrowUp":
          keyboardNav.handleArrowKeys(e, shiftsContainer, e.currentTarget, {
            orientation: "vertical",
            itemSelector: '[role="option"]',
          });
          break;
        case "Tab":
          // Allow normal tab navigation
          if (assignmentMode && selectedShifts.size > 0) {
            // Focus should move to disponenten section
            setTimeout(() => {
              const firstDisponent =
                disponentiRef.current?.querySelector('[role="option"]');
              if (firstDisponent) {
                firstDisponent.focus();
              }
            }, 0);
          }
          break;
        case "Escape":
          if (assignmentMode) {
            e.preventDefault();
            setAssignmentMode(false);
            setSelectedShifts(new Set());
            if (liveRegionRef.current) {
              liveRegionRef.current.announce(
                "Zuweisungsmodus beendet. Alle Auswahlen entfernt.",
              );
            }
          }
          break;
        default:
          break;
      }
    },
    [selectedShifts, assignmentMode],
  );

  const handleDisponentKeyDown = useCallback(
    (e, disp) => {
      const disponentiContainer = disponentiRef.current;
      if (!disponentiContainer) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (selectedShifts.size > 0) {
            // Bulk assign selected shifts to this disponent
            selectedShifts.forEach((shiftId) => {
              assignShift(shiftId, disp.name);
            });

            if (liveRegionRef.current) {
              liveRegionRef.current.announce(
                `${selectedShifts.size} Schicht${selectedShifts.size > 1 ? "en" : ""} erfolgreich ${disp.name} zugewiesen.`,
              );
            }

            setSelectedShifts(new Set());
            setAssignmentMode(false);
          }
          break;
        case "ArrowDown":
        case "ArrowUp":
          keyboardNav.handleArrowKeys(e, disponentiContainer, e.currentTarget, {
            orientation: "vertical",
            itemSelector: '[role="option"]',
          });
          break;
        case "Escape":
          e.preventDefault();
          setAssignmentMode(false);
          setSelectedShifts(new Set());
          if (liveRegionRef.current) {
            liveRegionRef.current.announce(
              "Zuweisungsmodus beendet. Alle Auswahlen entfernt.",
            );
          }
          // Return focus to shifts section
          setTimeout(() => {
            const firstShift =
              shiftsRef.current?.querySelector('[role="option"]');
            if (firstShift) {
              firstShift.focus();
            }
          }, 0);
          break;
        default:
          break;
      }
    },
    [selectedShifts, assignShift],
  );

  // Bulk operations
  const handleSelectAll = useCallback(() => {
    const allIds = new Set(unassignedShifts.map((shift) => shift.id));
    setSelectedShifts(allIds);
    if (liveRegionRef.current) {
      liveRegionRef.current.announce(
        `Alle ${allIds.size} Schichten ausgewählt.`,
      );
    }
  }, [unassignedShifts]);

  const handleDeselectAll = useCallback(() => {
    setSelectedShifts(new Set());
    setAssignmentMode(false);
    if (liveRegionRef.current) {
      liveRegionRef.current.announce("Alle Auswahlen entfernt.");
    }
  }, []);

  const handleBulkAssign = useCallback(
    (disponentName) => {
      if (selectedShifts.size === 0) return;

      selectedShifts.forEach((shiftId) => {
        assignShift(shiftId, disponentName);
      });

      if (liveRegionRef.current) {
        liveRegionRef.current.announce(
          `${selectedShifts.size} Schicht${selectedShifts.size > 1 ? "en" : ""} erfolgreich ${disponentName} zugewiesen.`,
        );
      }

      setSelectedShifts(new Set());
      setAssignmentMode(false);
    },
    [selectedShifts, assignShift],
  );

  // Update drag states for disponenten
  useEffect(() => {
    if (disponentiRef.current) {
      const disponentiElements =
        disponentiRef.current.querySelectorAll('[role="option"]');
      disponentiElements.forEach((element, index) => {
        const disp = filteredDisponenten[index];
        if (disp) {
          dragDropAria.setDropZoneState(
            element,
            draggedShift !== null,
            draggedOver === disp.id,
          );
        }
      });
    }
  }, [draggedShift, draggedOver, filteredDisponenten]);

  return (
    <div
      className={`h-full flex bg-white relative ${selectedShifts.size > 0 || assignmentMode ? "pt-16" : ""}`}
    >
      {/* Hidden instructions for screen readers */}
      <div id="drag-instructions" className="sr-only">
        Use drag and drop or keyboard navigation to assign shifts. For keyboard:
        Select shifts with Enter or Space, then Tab to disponenten and press
        Enter to assign. Press Escape to cancel assignment mode.
      </div>

      {/* Skip links */}
      <a
        href="#shifts-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white"
      >
        Skip to shifts
      </a>
      <a
        href="#disponenten-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white"
      >
        Skip to disponenten
      </a>

      {/* Enhanced persistent selection indicator */}
      {(selectedShifts.size > 0 || assignmentMode) && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-100 to-green-100 border-b border-blue-200 p-3 z-40 shadow-sm">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-blue-800">
                  {assignmentMode
                    ? "🎯 Zuweisungsmodus aktiv"
                    : "📋 Mehrfachauswahl"}
                </span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                {selectedShifts.size} Schicht
                {selectedShifts.size !== 1 ? "en" : ""} ausgewählt
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-blue-700">
              {assignmentMode ? (
                <span>
                  Tab zu Disponenten, Enter zum Zuweisen, Escape zum Abbrechen
                </span>
              ) : (
                <span>Schichten ausgewählt - bereit für Sammelzuweisung</span>
              )}
              <button
                onClick={handleDeselectAll}
                className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                aria-label="Alle Auswahlen entfernen"
              >
                ✕ Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Panel - Unassigned Shifts */}
      <div
        id="shifts-section"
        className="w-1/2 border-r border-gray-200 flex flex-col"
        role="region"
        aria-labelledby="shifts-heading"
      >
        <div className="p-4 border-b border-gray-200">
          <h2
            id="shifts-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Nicht zugewiesene Schichten ({unassignedShifts.length})
          </h2>

          {/* Enhanced Bulk actions toolbar */}
          <div className="mt-3">
            {/* Selection controls */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-2 py-1"
                disabled={unassignedShifts.length === 0}
                aria-label="Alle Schichten auswählen"
              >
                ☑️ Alle auswählen
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded px-2 py-1"
                disabled={selectedShifts.size === 0}
                aria-label="Alle Auswahlen entfernen"
              >
                ❌ Alle abwählen
              </button>
            </div>

            {/* Selection status and batch actions */}
            {selectedShifts.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedShifts.size} ausgewählt
                    </span>
                    <span className="text-sm text-blue-700" aria-live="polite">
                      Schichten für Sammelzuweisung bereit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canAssign && (
                      <button
                        onClick={() => setShowBatchModal(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        aria-label={`${selectedShifts.size} Schichten als Sammelzuweisung zuweisen`}
                      >
                        📋 Sammelzuweisung ({selectedShifts.size})
                      </button>
                    )}
                    <button
                      onClick={handleDeselectAll}
                      className="inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      aria-label="Auswahl abbrechen"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          ref={shiftsRef}
          className="flex-1 overflow-y-auto p-4"
          role={unassignedShifts.length > 0 ? "listbox" : "region"}
          aria-label={`${unassignedShifts.length} nicht zugewiesene Schichten. Verwenden Sie Pfeiltasten zur Navigation, Enter oder Leertaste zur Auswahl.`}
          aria-multiselectable={
            unassignedShifts.length > 0 ? "true" : undefined
          }
          aria-describedby="drag-instructions"
          tabIndex={0}
        >
          {unassignedShifts.length === 0 ? (
            <div className="text-center text-gray-500 mt-8" role="status">
              Keine nicht zugewiesenen Schichten
            </div>
          ) : (
            <div className="space-y-2">
              {unassignedShifts.map((shift) => (
                <div
                  key={shift.id}
                  draggable
                  onDragStart={(e) => handleShiftDragStart(e, shift)}
                  onDragEnd={handleShiftDragEnd}
                  onKeyDown={(e) => handleShiftKeyDown(e, shift)}
                  tabIndex={0}
                  role="option"
                  aria-selected={selectedShifts.has(shift.id)}
                  aria-describedby={`shift-${shift.id}-description`}
                  className={`
                    relative p-3 border rounded-lg cursor-move transition-all group
                    ${
                      selectedShifts.has(shift.id)
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                    ${focusedShift === shift.id ? "ring-2 ring-blue-500" : ""}
                    hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  `}
                  onClick={() => {
                    if (selectedShifts.has(shift.id)) {
                      setSelectedShifts((prev) => {
                        const next = new Set(prev);
                        next.delete(shift.id);
                        return next;
                      });
                    } else {
                      setSelectedShifts((prev) => new Set([...prev, shift.id]));
                    }
                  }}
                >
                  {/* Selection indicator overlay */}
                  {selectedShifts.has(shift.id) && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    {/* Checkbox for selection */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={selectedShifts.has(shift.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedShifts(
                              (prev) => new Set([...prev, shift.id]),
                            );
                          } else {
                            setSelectedShifts((prev) => {
                              const next = new Set(prev);
                              next.delete(shift.id);
                              return next;
                            });
                          }
                        }}
                        aria-label={`Schicht ${shift.type || shift.name} auswählen`}
                      />

                      {/* Shift details */}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {shift.type || shift.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          📅 {shift.date} • ⏰ {shift.start}-{shift.end}
                        </div>
                        {shift.workLocation && (
                          <div className="text-xs text-gray-400">
                            📍{" "}
                            {WORK_LOCATIONS[shift.workLocation] ||
                              shift.workLocation}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selection status indicator */}
                    <div className="flex items-center gap-2">
                      {selectedShifts.has(shift.id) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✓ Ausgewählt
                        </span>
                      )}
                      {/* Drag handle */}
                      <div className="text-gray-400 group-hover:text-gray-600">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div id={`shift-${shift.id}-description`} className="sr-only">
                    Schicht {shift.type || shift.name} am {shift.date} von{" "}
                    {shift.start} bis {shift.end}
                    {shift.workLocation &&
                      ` bei ${WORK_LOCATIONS[shift.workLocation] || shift.workLocation}`}
                    .
                    {selectedShifts.has(shift.id)
                      ? " Ausgewählt."
                      : " Nicht ausgewählt."}
                    Drücken Sie Enter zum{" "}
                    {selectedShifts.has(shift.id) ? "Abwählen" : "Auswählen"}.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Disponenten */}
      <div
        id="disponenten-section"
        className="w-1/2 flex flex-col"
        role="region"
        aria-labelledby="disponenten-heading"
      >
        <div className="p-4 border-b border-gray-200">
          <h2
            id="disponenten-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Disponenten ({filteredDisponenten.length})
          </h2>

          {/* Filters */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="role-filter"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role === "all"
                      ? "All Roles"
                      : role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="availability-filter"
                className="block text-sm font-medium text-gray-700"
              >
                Availability
              </label>
              <select
                id="availability-filter"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {AVAILABILITY_OPTIONS.map((avail) => (
                  <option key={avail} value={avail}>
                    {avail === "all"
                      ? "All"
                      : avail.charAt(0).toUpperCase() + avail.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div
          ref={disponentiRef}
          className="flex-1 overflow-y-auto p-4"
          role={filteredDisponenten.length > 0 ? "listbox" : "region"}
          aria-label={`${filteredDisponenten.length} verfügbare Disponenten. Verwenden Sie Pfeiltasten zur Navigation, Enter oder Leertaste zur Zuweisung.`}
          aria-describedby="drag-instructions"
          tabIndex={0}
        >
          {filteredDisponenten.length === 0 ? (
            <div className="text-center text-gray-500 mt-8" role="status">
              Keine Disponenten entsprechen den aktuellen Filtern
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDisponenten.map((disp) => (
                <div
                  key={disp.id}
                  onDragOver={handleDisponentDragOver}
                  onDragEnter={(e) => handleDisponentDragEnter(e, disp)}
                  onDragLeave={handleDisponentDragLeave}
                  onDrop={(e) => handleDisponentDrop(e, disp)}
                  onKeyDown={(e) => handleDisponentKeyDown(e, disp)}
                  tabIndex={0}
                  role="option"
                  aria-describedby={`disp-${disp.id}-description`}
                  aria-label={`${disp.name}, ${disp.role}, ${disp.availability}${selectedShifts.size > 0 ? `, ${selectedShifts.size} Schichten zuweisen` : ""}`}
                  className={`
                    p-3 border rounded-lg transition-all cursor-pointer
                    ${
                      draggedOver === disp.id
                        ? "border-green-500 bg-green-50 ring-2 ring-green-300"
                        : "border-gray-200 hover:border-gray-300"
                    }
                    ${focusedDisponent === disp.id ? "ring-2 ring-blue-500" : ""}
                    hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  `}
                  onClick={() => {
                    if (selectedShifts.size > 0) {
                      handleBulkAssign(disp.name);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {disp.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {disp.role.charAt(0).toUpperCase() + disp.role.slice(1)}
                      </div>
                      <div className="text-xs text-gray-400">{disp.email}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`
                          w-2 h-2 rounded-full
                          ${disp.availability === "available" ? "bg-green-400" : "bg-yellow-400"}
                        `}
                        role="img"
                        aria-label={`Status: ${disp.availability}`}
                      />
                      {selectedShifts.size > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBulkAssign(disp.name);
                          }}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                          aria-label={`Assign ${selectedShifts.size} selected shifts to ${disp.name}`}
                        >
                          Assign {selectedShifts.size}
                        </button>
                      )}
                    </div>
                  </div>
                  <div id={`disp-${disp.id}-description`} className="sr-only">
                    {disp.name}, Rolle: {disp.role}, Status: {disp.availability}
                    .
                    {selectedShifts.size > 0 &&
                      ` Drücken Sie Enter, um ${selectedShifts.size} ausgewählte Schicht${selectedShifts.size > 1 ? "en" : ""} zuzuweisen.`}
                    {draggedOver === disp.id &&
                      " Ablagezone aktiv - loslassen zum Zuweisen."}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batch Assignment Modal */}
      <BatchAssignmentModal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          // Clear selections after assignment
          setSelectedShifts(new Set());
          setAssignmentMode(false);
        }}
        selectedShifts={Array.from(selectedShifts)}
        disponenten={SAMPLE_DISPONENTEN}
      />
    </div>
  );
}
