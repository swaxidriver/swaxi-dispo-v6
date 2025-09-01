import React, { useState, useMemo, useContext, useCallback } from "react";

import { useShifts } from "../contexts/useShifts";
import { useShiftTemplates } from "../contexts/useShiftTemplates";
import { canManageShifts } from "../lib/rbac";
import AuthContext from "../contexts/AuthContext";
import { useMobileDevice } from "../hooks/useMobileDevice";
import _ShiftTable from "../components/ShiftTable";
import { CreateShiftModal, ShiftDetailsModal } from "../features/shifts";
import AssignmentDragDrop from "../ui/assignment-dnd";
import {
  ShiftCell,
  TimelineShiftCell,
  QUICK_ACTIONS,
  getShiftTemplateColor,
} from "../ui/calendar-views.jsx";
import { keyboardNav, skipLinks } from "../ui/accessibility";
import ConflictBadge from "../components/ConflictBadge";

const DAYS = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];
const HOURS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`,
);
const DAY_MINUTES = 24 * 60;
const PX_PER_HOUR = 48; // calendar row height baseline
const DAY_HEIGHT = 24 * PX_PER_HOUR;

function buildDate(dateLike) {
  return dateLike instanceof Date ? new Date(dateLike) : new Date(dateLike);
}

function combine(dateLike, timeStr) {
  const d = buildDate(dateLike);
  if (!timeStr) return d;
  const [h, m] = timeStr.split(":").map(Number);
  d.setHours(h, m || 0, 0, 0);
  return d;
}

function getShiftSpanForDay(shift, dayDate) {
  // Returns pixel offset & height (in px) within a single day column
  const startDate = combine(shift.date, shift.start);
  let endDate = combine(shift.date, shift.end);
  if (endDate <= startDate) {
    // overnight shift crosses midnight
    endDate.setDate(endDate.getDate() + 1);
  }
  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // overlap check
  if (startDate >= dayEnd || endDate <= dayStart) return null;

  const visibleStart = startDate < dayStart ? dayStart : startDate;
  const visibleEnd = endDate > dayEnd ? dayEnd : endDate;
  const minutesFromDayStart = (visibleStart - dayStart) / 60000;
  const visibleMinutes = (visibleEnd - visibleStart) / 60000;
  const top = (minutesFromDayStart / DAY_MINUTES) * DAY_HEIGHT;
  const height = Math.max((visibleMinutes / DAY_MINUTES) * DAY_HEIGHT, 12); // minimum height: --space-3 (12px)
  return { top, height };
}

// Memoized calendar cell for better performance (explicit displayName for lint clarity)
const CalendarCell = React.memo(
  ({ day, onDayClick, onShiftClick, onQuickAction, templates = [] }) => (
    <div
      className={`min-h-[100px] p-2 border-r border-b border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 ${
        !day.isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
      } ${day.isToday ? "bg-blue-50 ring-2 ring-blue-500 ring-inset" : ""}`}
      onClick={() => onDayClick(day)}
    >
      <div className="text-sm font-medium mb-1">{day.date.getDate()}</div>

      {/* Shift markers with template colors */}
      <div className="space-y-1">
        {day.shifts.slice(0, 3).map((shift) => (
          <ShiftCell
            key={shift.id}
            shift={shift}
            templates={templates}
            onShiftClick={onShiftClick}
            onQuickAction={onQuickAction}
            size="compact"
            showQuickActions={false} // Too small for quick actions in month view
            conflicts={shift.conflicts || []}
          />
        ))}
        {day.shifts.length > 3 && (
          <div className="text-xs text-gray-500">
            +{day.shifts.length - 3} weitere
          </div>
        )}
      </div>
    </div>
  ),
);
CalendarCell.displayName = "CalendarCell";

// Mobile Calendar Day Card Component
const MobileCalendarDay = React.memo(({ 
  day, 
  shifts, 
  onShiftClick, 
  onQuickAction, 
  templates, 
  isToday 
}) => (
  <div className="calendar-mobile-day-card" role="region" aria-labelledby={`mobile-day-${day.getDate()}`}>
    <div className="calendar-mobile-day-header">
      <div>
        <h3 id={`mobile-day-${day.getDate()}`} className="text-lg font-semibold text-gray-900">
          {day.toLocaleDateString("de-DE", { weekday: "long" })}
        </h3>
        <p className="text-sm text-gray-500">
          {day.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
          {isToday && <span className="ml-2 text-blue-600 font-medium">(Heute)</span>}
        </p>
      </div>
      <div className="text-right">
        <span className="text-sm text-gray-600">
          {shifts.length === 0 ? "Keine Dienste" : `${shifts.length} Dienst${shifts.length > 1 ? "e" : ""}`}
        </span>
      </div>
    </div>
    
    {shifts.length > 0 ? (
      <div className="calendar-mobile-shifts" role="list" aria-label={`Dienste für ${day.toLocaleDateString("de-DE", { weekday: "long" })}`}>
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className="calendar-mobile-shift-item"
            role="listitem"
            tabIndex={0}
            aria-label={`${shift.type || shift.name}, ${shift.start} bis ${shift.end}, ${shift.assignedTo ? `zugewiesen an ${shift.assignedTo}` : "offen"}`}
            onClick={() => onShiftClick?.(shift)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onShiftClick?.(shift);
              }
            }}
            style={{
              borderLeftColor: getShiftTemplateColor(shift, templates),
              borderLeftWidth: "4px",
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="calendar-mobile-shift-name">
                  {shift.type || shift.name}
                </div>
                <div className="calendar-mobile-shift-time">
                  {shift.start} - {shift.end}
                </div>
              </div>
              <div className={`calendar-mobile-shift-status ${shift.assignedTo ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                {shift.assignedTo ? shift.assignedTo : "Offen"}
              </div>
            </div>
            {shift.conflicts?.length > 0 && (
              <div className="mt-2">
                <ConflictBadge conflicts={shift.conflicts} />
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <div className="text-sm">Keine Dienste an diesem Tag</div>
      </div>
    )}
  </div>
));
MobileCalendarDay.displayName = "MobileCalendarDay";

export default function Calendar() {
  // Named export for clearer stack traces
  const { state, applyToShift, assignShift, updateShift, undoLastShiftUpdate } =
    useShifts();
  const { templates } = useShiftTemplates();
  // Initialize to earliest shift date (improves default relevance & fixes test expectations)
  const [selectedDate, setSelectedDate] = useState(() => {
    if (state.shifts && state.shifts.length > 0) {
      const sorted = [...state.shifts].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );
      return new Date(sorted[0].date);
    }
    return new Date();
  });
  // Ensure selectedDate updates once after asynchronous (or deferred) shift bootstrap.
  // Without this, initial empty state causes us to default to "today" (e.g., 2025),
  // while test fixtures seed historical dates (e.g., 2024-01-15) that never become visible.
  const [autoDateApplied, setAutoDateApplied] = useState(false);
  React.useEffect(() => {
    if (!autoDateApplied && state.shifts && state.shifts.length) {
      const earliest = state.shifts.reduce(
        (min, s) => (new Date(s.date) < min ? new Date(s.date) : min),
        new Date(state.shifts[0].date),
      );
      // Only adjust if the current selectedDate week does not contain any shifts to avoid overriding user navigation.
      const weekStartProbe = new Date(selectedDate);
      weekStartProbe.setHours(0, 0, 0, 0);
      const day = weekStartProbe.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      weekStartProbe.setDate(weekStartProbe.getDate() + diffToMonday);
      const weekEndProbe = new Date(weekStartProbe);
      weekEndProbe.setDate(weekEndProbe.getDate() + 7);
      const hasShiftInCurrentWeek = state.shifts.some((s) => {
        const d = new Date(s.date);
        return d >= weekStartProbe && d < weekEndProbe;
      });
      if (!hasShiftInCurrentWeek) {
        setSelectedDate(new Date(earliest));
      }
      setAutoDateApplied(true);
    }
  }, [autoDateApplied, state.shifts, selectedDate]);
  const [viewMode, setViewMode] = useState("week"); // 'week', 'month', or 'assignment'
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Mobile device detection with resize handling
  const isMobileDevice = useMobileDevice();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const isMobile = isMobileDevice || windowWidth <= 420;

  // Drag & Drop state
  const [draggedShift, setDraggedShift] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [dragOverTime, setDragOverTime] = useState(null);

  // Keyboard navigation state
  const [focusedDay, setFocusedDay] = useState(null);
  const [focusedTimeSlot, setFocusedTimeSlot] = useState(null);

  const auth = useContext(AuthContext);
  const userRole = auth?.user?.role || "analyst";

  const { weekShifts, weekStart } = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    // Monday baseline
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const filtered = state.shifts.filter((s) => {
      // consider shifts overlapping week (including overnight spill)
      const baseDate = buildDate(s.date);
      const startDateTime = combine(baseDate, s.start);
      let endDateTime = combine(baseDate, s.end);
      if (endDateTime <= startDateTime)
        endDateTime.setDate(endDateTime.getDate() + 1);
      return startDateTime < end && endDateTime >= start;
    });
    return { weekShifts: filtered, weekStart: start };
  }, [state.shifts, selectedDate]);

  const { monthDays } = useMemo(() => {
    if (viewMode !== "month") return { monthDays: [] };

    const start = new Date(selectedDate);
    start.setDate(1); // First day of month
    start.setHours(0, 0, 0, 0);

    // Start from Monday of the week containing the first day
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);

    const monthStart = new Date(start);
    const days = [];

    // Generate 6 weeks (42 days) for month view
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(monthStart);
      currentDay.setDate(monthStart.getDate() + i);

      const dayStart = new Date(currentDay);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // Get shifts for this day - optimized filtering
      const dayShifts = state.shifts.filter((s) => {
        const shiftDate = s.date;
        if (typeof shiftDate === "string") {
          // Quick string comparison for performance
          const dayStr = currentDay.toISOString().slice(0, 10);
          return shiftDate === dayStr;
        }

        // Fallback to full date comparison for complex date handling
        const baseDate = buildDate(s.date);
        const startDateTime = combine(baseDate, s.start);
        let endDateTime = combine(baseDate, s.end);
        if (endDateTime <= startDateTime)
          endDateTime.setDate(endDateTime.getDate() + 1);
        return startDateTime < dayEnd && endDateTime >= dayStart;
      });

      days.push({
        date: new Date(currentDay),
        shifts: dayShifts,
        isCurrentMonth: currentDay.getMonth() === selectedDate.getMonth(),
        isToday: currentDay.toDateString() === new Date().toDateString(),
      });
    }

    return { monthDays: days };
  }, [state.shifts, selectedDate, viewMode]);

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const navigate = (direction) => {
    if (viewMode === "month") {
      navigateMonth(direction);
    } else {
      navigateWeek(direction);
    }
  };

  const handleShiftClick = (shift) => {
    setSelectedShift(shift);
    setIsDetailsOpen(true);
  };

  const handleCreateShift = () => {
    if (canManageShifts(userRole)) {
      setIsCreateOpen(true);
    }
  };

  const handleApplyToShift = async (shiftId, userId) => {
    return applyToShift(shiftId, userId);
  };

  const handleAssignShift = async (shiftId, userId) => {
    return assignShift(shiftId, userId);
  };

  const handleQuickAction = (shift, action) => {
    console.log(`Quick action ${action} for shift ${shift.id}`);
    switch (action) {
      case QUICK_ACTIONS.NOTE:
        // Open note dialog
        setSelectedShift(shift);
        setIsDetailsOpen(true);
        break;
      case QUICK_ACTIONS.SWAP:
        // TODO: Implement swap functionality
        alert("Swap functionality will be implemented");
        break;
      case QUICK_ACTIONS.RELEASE:
        // Release assignment
        if (shift.assignedTo) {
          assignShift(shift.id, null);
        }
        break;
      default:
        console.warn("Unknown quick action:", action);
    }
  };

  const handleDayClick = (day) => {
    setSelectedDate(new Date(day.date));
    if (day.shifts.length > 0) {
      setSelectedShift(day.shifts[0]);
      setIsDetailsOpen(true);
    }
  };

  // Drag & Drop handlers
  const handleShiftDragStart = (e, shift) => {
    setDraggedShift(shift);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", shift.id);
    // Add visual feedback
    e.target.style.opacity = "0.5";
  };

  const handleShiftDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedShift(null);
    setDragOverDay(null);
    setDragOverTime(null);
  };

  const handleDayDragOver = (e, dayDate) => {
    if (!draggedShift) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(dayDate);

    // Calculate time from mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const timePercent = y / DAY_HEIGHT;
    const minutesFromMidnight = timePercent * DAY_MINUTES;
    const hours = Math.floor(minutesFromMidnight / 60);
    const minutes = Math.floor((minutesFromMidnight % 60) / 15) * 15; // Snap to 15-minute intervals
    setDragOverTime(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    );
  };

  const handleDayDragLeave = (e) => {
    // Only clear if leaving the day column entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDragOverDay(null);
      setDragOverTime(null);
    }
  };

  const handleDayDrop = (e, dayDate) => {
    e.preventDefault();

    if (!draggedShift || !dragOverTime) return;

    const newDate = new Date(dayDate).toISOString().slice(0, 10);
    const startTime = dragOverTime;

    // Calculate end time based on original duration
    const originalStart = draggedShift.start;
    const originalEnd = draggedShift.end;
    const startMinutes =
      parseInt(originalStart.split(":")[0]) * 60 +
      parseInt(originalStart.split(":")[1]);
    const endMinutes =
      parseInt(originalEnd.split(":")[0]) * 60 +
      parseInt(originalEnd.split(":")[1]);
    let duration = endMinutes - startMinutes;

    // Handle overnight shifts
    if (duration < 0) {
      duration += 24 * 60; // Add 24 hours worth of minutes
    }

    const newStartMinutes =
      parseInt(startTime.split(":")[0]) * 60 +
      parseInt(startTime.split(":")[1]);
    let newEndMinutes = newStartMinutes + duration;

    // Handle end time going past midnight
    let endTime;
    if (newEndMinutes >= 24 * 60) {
      newEndMinutes -= 24 * 60;
      endTime = `${String(Math.floor(newEndMinutes / 60)).padStart(2, "0")}:${String(newEndMinutes % 60).padStart(2, "0")}`;
    } else {
      endTime = `${String(Math.floor(newEndMinutes / 60)).padStart(2, "0")}:${String(newEndMinutes % 60).padStart(2, "0")}`;
    }

    // Update the shift
    const result = updateShift(draggedShift.id, {
      date: newDate,
      start: startTime,
      end: endTime,
    });

    if (!result.success) {
      // Show error notification - the updateShift method already handles this
      console.warn("Failed to move shift:", result.error);
    }

    // Reset drag state
    setDraggedShift(null);
    setDragOverDay(null);
    setDragOverTime(null);
  };

  // Keyboard shortcut for undo
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const undoResult = undoLastShiftUpdate();
        if (!undoResult) {
          // Show notification that there's nothing to undo
          console.log("Nothing to undo");
        }
      }
    },
    [undoLastShiftUpdate],
  );

  // Calendar grid keyboard navigation
  const handleCalendarKeyDown = useCallback(
    (e) => {
      if (viewMode === "assignment") return; // Skip in assignment mode

      const calendarGrid = e.currentTarget;
      const focusableElements = calendarGrid.querySelectorAll(
        '[tabindex="0"], [role="gridcell"][tabindex="0"]',
      );

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
          keyboardNav.handleArrowKeys(e, calendarGrid, e.target, {
            orientation: "both",
            itemSelector: '[role="gridcell"][tabindex="0"]',
          });
          break;
        case "Home":
          e.preventDefault();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
          break;
        case "End":
          e.preventDefault();
          if (focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1].focus();
          }
          break;
        case "PageUp":
          e.preventDefault();
          // Navigate to previous week/month
          if (viewMode === "week") {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 7);
            setSelectedDate(newDate);
          } else if (viewMode === "month") {
            const newDate = new Date(selectedDate);
            newDate.setMonth(newDate.getMonth() - 1);
            setSelectedDate(newDate);
          }
          break;
        case "PageDown":
          e.preventDefault();
          // Navigate to next week/month
          if (viewMode === "week") {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 7);
            setSelectedDate(newDate);
          } else if (viewMode === "month") {
            const newDate = new Date(selectedDate);
            newDate.setMonth(newDate.getMonth() + 1);
            setSelectedDate(newDate);
          }
          break;
        default:
          break;
      }
    },
    [viewMode, selectedDate],
  );

  // Add keyboard listener
  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="container mx-auto px-4 py-8"
      role="main"
      aria-labelledby="calendar-title"
    >
      {/* Skip links */}
      <a
        href="#calendar-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white"
      >
        Zum Kalender springen
      </a>
      <a
        href="#view-controls"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white"
      >
        Zu den Ansichtsoptionen springen
      </a>

      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 id="calendar-title" className="text-3xl font-bold">
            Kalender
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {viewMode === "month"
              ? "Monatsübersicht der Dienste"
              : viewMode === "assignment"
                ? "Dienste zuweisen per Drag & Drop"
                : "Wochenübersicht der Dienste"}
          </p>
        </div>
        <div id="view-controls" className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          {/* View Mode Toggle */}
          <div
            className="flex rounded-md shadow-sm view-mode-toggle"
            role="group"
            aria-label="Ansichtsmodus auswählen"
          >
            <button
              type="button"
              onClick={() => setViewMode("week")}
              aria-pressed={viewMode === "week"}
              aria-label="Wochenansicht"
              className={`px-3 py-2 xs:px-4 xs:py-3 text-sm font-medium rounded-l-md border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 xs:min-h-[44px] ${
                viewMode === "week"
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Woche
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              aria-pressed={viewMode === "month"}
              aria-label="Monatsansicht"
              className={`px-3 py-2 xs:px-4 xs:py-3 text-sm font-medium border-l-0 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 xs:min-h-[44px] ${
                viewMode === "month"
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Monat
            </button>
            {canManageShifts(userRole) && (
              <button
                type="button"
                onClick={() => setViewMode("assignment")}
                aria-pressed={viewMode === "assignment"}
                aria-label="Zuweisungsansicht"
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-l-0 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  viewMode === "assignment"
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Zuweisen
              </button>
            )}
          </div>

          {viewMode !== "assignment" && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={
                viewMode === "month"
                  ? "Zum vorherigen Monat navigieren"
                  : "Zur vorherigen Woche navigieren"
              }
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {viewMode === "month" ? "Vorheriger Monat" : "Vorherige Woche"}
            </button>
          )}
          {viewMode !== "assignment" && (
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              aria-label="Zu heute navigieren"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              Heute
            </button>
          )}
          {viewMode !== "assignment" && (
            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label={
                viewMode === "month"
                  ? "Zum nächsten Monat navigieren"
                  : "Zur nächsten Woche navigieren"
              }
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {viewMode === "month" ? "Nächster Monat" : "Nächste Woche"}
            </button>
          )}
          {canManageShifts(userRole) && (
            <button
              type="button"
              onClick={handleCreateShift}
              aria-label="Neuen Dienst erstellen"
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm bg-[var(--color-primary)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              Dienst erstellen
            </button>
          )}
          {canManageShifts(userRole) && state.undoState && (
            <button
              type="button"
              onClick={() => undoLastShiftUpdate()}
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              title="Rückgängig (Strg+Z)"
            >
              ↶ Rückgängig
            </button>
          )}
        </div>
      </div>

      {viewMode === "assignment" ? (
        // Assignment View
        <div className="bg-white shadow rounded-lg" style={{ height: 'calc(var(--vh-dynamic, 1vh) * 100 - 12rem)' }}>
          <AssignmentDragDrop />
        </div>
      ) : viewMode === "week" ? (
        // Week View - Mobile vs Desktop Layout
        isMobile ? (
          // Mobile Vertical Calendar Layout
          <div
            id="calendar-content-mobile"
            className="calendar-mobile-vertical"
            role="application"
            aria-label="Mobile Wochenkalender"
          >
            {DAYS.map((dayName, dayIdx) => {
              const dayDate = new Date(weekStart);
              dayDate.setDate(weekStart.getDate() + dayIdx);
              const dayStart = new Date(dayDate);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(dayStart);
              dayEnd.setDate(dayEnd.getDate() + 1);
              
              const dayShifts = weekShifts.filter((shift) => {
                const base = buildDate(shift.date);
                const s = combine(base, shift.start);
                let e = combine(base, shift.end);
                if (e <= s) e.setDate(e.getDate() + 1);
                return s < dayEnd && e > dayStart;
              });

              const isToday = dayDate.toDateString() === new Date().toDateString();

              return (
                <MobileCalendarDay
                  key={dayIdx}
                  day={dayDate}
                  shifts={dayShifts}
                  onShiftClick={handleShiftClick}
                  onQuickAction={handleQuickAction}
                  templates={templates}
                  isToday={isToday}
                />
              );
            })}
          </div>
        ) : (
          // Desktop Horizontal Calendar Layout
          <div
            id="calendar-content"
            className="bg-white shadow rounded-lg overflow-x-auto calendar-week-container"
            role="application"
            aria-label="Wochenkalender"
          >
            <div className="min-w-[960px] calendar-week-grid" onKeyDown={handleCalendarKeyDown}>
            {/* Header */}
            <div
              className="grid grid-cols-8 bg-gray-100 border-b border-gray-200"
              role="rowgroup"
            >
              <div
                className="p-2 text-xs font-medium text-gray-500"
                role="columnheader"
              >
                Zeit
              </div>
              {DAYS.map((label, idx) => {
                const d = new Date(weekStart);
                d.setDate(weekStart.getDate() + idx);
                return (
                  <div
                    key={label}
                    className="p-2 text-center text-xs font-medium text-gray-600"
                    role="columnheader"
                    aria-label={`${label}, ${d.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}`}
                  >
                    <div>{label}</div>
                    <div className="text-[10px] text-gray-400">
                      {d.toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="grid grid-cols-8"
              role="grid"
              aria-label={`Kalenderwoche vom ${weekStart.toLocaleDateString("de-DE")}`}
            >
              {/* Time column */}
              <div
                className="relative border-r border-gray-200"
                style={{ height: DAY_HEIGHT }}
              >
                {HOURS.map((h, i) => (
                  <div
                    key={h}
                    className="absolute left-0 w-full flex items-start"
                    style={{ top: i * PX_PER_HOUR }}
                  >
                    <div className="text-[10px] text-gray-400 pl-1 -mt-2">
                      {h}
                    </div>
                    <div className="w-full h-px bg-gray-100 translate-y-4" />
                  </div>
                ))}
              </div>
              {/* Day columns */}
              {DAYS.map((_, dayIdx) => {
                const dayDate = new Date(weekStart);
                dayDate.setDate(weekStart.getDate() + dayIdx);
                const dayStart = new Date(dayDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);
                const dayShifts = weekShifts.filter((shift) => {
                  const base = buildDate(shift.date);
                  const s = combine(base, shift.start);
                  let e = combine(base, shift.end);
                  if (e <= s) e.setDate(e.getDate() + 1);
                  return s < dayEnd && e > dayStart;
                });
                return (
                  <div
                    key={dayIdx}
                    className={`relative border-r border-gray-100 ${
                      dragOverDay && dragOverDay.getTime() === dayDate.getTime()
                        ? "bg-blue-50"
                        : ""
                    }`}
                    style={{ height: DAY_HEIGHT }}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`${DAYS[dayIdx]}, ${dayDate.toLocaleDateString("de-DE")}${dayShifts.length > 0 ? `, ${dayShifts.length} Dienst${dayShifts.length > 1 ? "e" : ""}` : ", keine Dienste"}`}
                    onDragOver={(e) => handleDayDragOver(e, dayDate)}
                    onDragLeave={handleDayDragLeave}
                    onDrop={(e) => handleDayDrop(e, dayDate)}
                    onFocus={() => setFocusedDay(dayDate)}
                    onBlur={() => setFocusedDay(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        // Open create shift modal for this day
                        setSelectedDate(dayDate);
                        setIsCreateOpen(true);
                      }
                    }}
                  >
                    {/* Hour grid lines */}
                    {HOURS.map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 w-full h-px bg-gray-100"
                        style={{ top: i * PX_PER_HOUR }}
                      />
                    ))}

                    {/* Drag preview indicator */}
                    {dragOverDay &&
                      dragOverDay.getTime() === dayDate.getTime() &&
                      dragOverTime && (
                        <div
                          className="absolute left-0 right-0 h-1 bg-blue-400 opacity-75 z-10"
                          style={{
                            top:
                              ((parseInt(dragOverTime.split(":")[0]) * 60 +
                                parseInt(dragOverTime.split(":")[1])) /
                                DAY_MINUTES) *
                              DAY_HEIGHT,
                          }}
                        />
                      )}

                    {dayShifts.map((shift) => {
                      const span = getShiftSpanForDay(shift, dayDate);
                      if (!span) return null;
                      return (
                        <TimelineShiftCell
                          key={`${shift.id}_${dayIdx}`}
                          shift={shift}
                          templates={templates}
                          span={span}
                          dayIdx={dayIdx}
                          onShiftClick={handleShiftClick}
                          onQuickAction={handleQuickAction}
                          onDragStart={(e) => handleShiftDragStart(e, shift)}
                          onDragEnd={handleShiftDragEnd}
                          isDraggable={canManageShifts(userRole)}
                          isDragged={draggedShift?.id === shift.id}
                          conflicts={shift.conflicts || []}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )
      ) : (
        // Month View
        <div
          id="calendar-content"
          className="bg-white shadow rounded-lg overflow-hidden"
          role="application"
          aria-label="Monatskalender"
        >
          {/* Month Header */}
          <div className="bg-gray-100 border-b border-gray-200 p-4">
            <h2
              className="text-lg font-semibold text-center"
              id="month-heading"
            >
              {selectedDate.toLocaleDateString("de-DE", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>

          {/* Day headers */}
          <div
            className="grid grid-cols-7 bg-gray-50 border-b border-gray-200"
            role="rowgroup"
          >
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
                role="columnheader"
                aria-label={day}
              >
                {day.slice(0, 2)}
              </div>
            ))}
          </div>

          {/* Month Grid */}
          <div
            className="grid grid-cols-7"
            role="grid"
            aria-labelledby="month-heading"
            onKeyDown={handleCalendarKeyDown}
          >
            {monthDays.map((day, index) => (
              <CalendarCell
                key={index}
                day={day}
                onDayClick={handleDayClick}
                onShiftClick={handleShiftClick}
                onQuickAction={handleQuickAction}
                templates={templates}
              />
            ))}
          </div>
        </div>
      )}

      {viewMode !== "assignment" && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">
            {viewMode === "month" ? "Dieser Monat" : "Diese Woche"}
          </h2>
          <_ShiftTable
            shifts={
              viewMode === "month"
                ? state.shifts.filter((s) => {
                    const shiftDate = new Date(s.date);
                    return (
                      shiftDate.getMonth() === selectedDate.getMonth() &&
                      shiftDate.getFullYear() === selectedDate.getFullYear()
                    );
                  })
                : weekShifts
            }
          />
        </div>
      )}

      <CreateShiftModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultDate={selectedDate}
      />

      <ShiftDetailsModal
        shift={selectedShift}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onApply={handleApplyToShift}
        onAssign={handleAssignShift}
        currentUser={auth?.user}
        userRole={userRole}
      />
    </div>
  );
}
