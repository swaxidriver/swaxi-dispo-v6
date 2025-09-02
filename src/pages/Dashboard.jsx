import { useState, useMemo, useCallback } from "react";

import { useShifts } from "../contexts/useShifts";
import { useAuth } from "../contexts/useAuth";
import { useI18n } from "../hooks/useI18n";
import { ROLES } from "../utils/constants";
import { canManageShifts } from "../lib/rbac";
import MiniAnalytics from "../components/MiniAnalytics";
import { ShiftTable } from "../features/shifts";
import NotificationMenu from "../components/NotificationMenu";
import ThemeToggle from "../components/ThemeToggle";
import ConnectionStatus from "../components/ConnectionStatus";
import AutoAssignModal from "../components/AutoAssignModal";
import {
  generateAutoAssignmentPlan,
  executeAutoAssignmentPlan,
} from "../utils/autoAssignment";

function QuickFilters({ onChange }) {
  const { t } = useI18n();

  // Memoize filters array to prevent recreation on every render
  const filters = useMemo(
    () => [
      { id: "today", name: t("filterToday") },
      { id: "7days", name: t("filter7Days") },
      { id: "open", name: t("filterOpen") },
      { id: "assigned", name: t("filterAssigned") },
      { id: "cancelled", name: t("filterCancelled") },
    ],
    [t],
  );

  return (
    <div className="flex space-x-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {filter.name}
        </button>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { state, assignShift } = useShifts();
  const { user } = useAuth();
  const { t } = useI18n();
  const [filter, setFilter] = useState("today");
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const userRole = user?.role || ROLES.ANALYST; // fallback to lowest privilege if unauthenticated

  // Memoize analytics handler to prevent recreation
  const handleAnalyticsViewSource = useCallback((statId) => {
    // Map analytics stat IDs to filter values that make sense for the user
    switch (statId) {
      case "open":
        setFilter("open");
        break;
      case "assigned-today":
        setFilter("today"); // Show today's shifts (which will include assigned ones)
        break;
      case "conflicts":
        // For conflicts, we'll show all shifts and let the user see which ones have conflicts
        // in the ShiftTable (conflicts are usually displayed as badges or indicators)
        setFilter("all");
        break;
      case "applications-7d":
        setFilter("7days"); // Show shifts from last 7 days where applications might be relevant
        break;
      default:
        setFilter("today");
    }
  }, []);

  // Memoize filtered shifts to avoid recalculation on every render
  const filteredShifts = useMemo(() => {
    return state.shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      const today = new Date();

      switch (filter) {
        case "today":
          return shiftDate.toDateString() === today.toDateString();
        case "7days": {
          const sevenDaysFromNow = new Date(today.setDate(today.getDate() + 7));
          return shiftDate <= sevenDaysFromNow;
        }
        case "open":
          return shift.status === "open";
        case "assigned":
          return shift.status === "assigned";
        case "cancelled":
          return shift.status === "cancelled";
        default:
          return true;
      }
    });
  }, [state.shifts, filter]);

  // Sample disponenten data - in a real app this would come from a context or API
  const sampleDisponenten = useMemo(
    () => [
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
    ],
    [],
  );

  // Generate auto-assignment plan when modal opens
  const plannedAssignments = useMemo(() => {
    if (!showAutoAssignModal) return [];
    return generateAutoAssignmentPlan(state.shifts, sampleDisponenten);
  }, [showAutoAssignModal, state.shifts, sampleDisponenten]);

  const handleAutoAssignClick = useCallback(() => {
    setShowAutoAssignModal(true);
  }, []);

  const handleAutoAssignConfirm = useCallback(async () => {
    setIsAutoAssigning(true);
    try {
      const result = await executeAutoAssignmentPlan(
        plannedAssignments,
        assignShift,
      );
      console.log("Auto-assignment completed:", result);

      // Show success message - for now just log, could be enhanced with toast notifications
      if (result.successCount > 0) {
        console.log(`Successfully assigned ${result.successCount} shifts`);
      }
      if (result.errorCount > 0) {
        console.error(
          `Failed to assign ${result.errorCount} shifts:`,
          result.errors,
        );
      }
    } catch (error) {
      console.error("Auto-assignment failed:", error);
    } finally {
      setIsAutoAssigning(false);
      setShowAutoAssignModal(false);
    }
  }, [plannedAssignments, assignShift]);

  const handleAutoAssignClose = useCallback(() => {
    setShowAutoAssignModal(false);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Connection Status - NEW: Shows SharePoint/localStorage mode */}
      <div className="mb-6">
        <ConnectionStatus />
      </div>

      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("dashboardDescription")}
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-3 md:ml-4 md:mt-0">
          <NotificationMenu />
          <ThemeToggle />
          {canManageShifts(userRole) && (
            <button
              type="button"
              onClick={handleAutoAssignClick}
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm bg-[var(--color-primary)] hover:opacity-90"
            >
              {t("automaticAssignment")}
            </button>
          )}
        </div>
      </div>

      <div className="mb-8">
        <MiniAnalytics onViewSource={handleAnalyticsViewSource} />
      </div>

      <div className="mb-4">
        <QuickFilters onChange={setFilter} />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t("currentShifts")}</h2>
        <ShiftTable shifts={filteredShifts} />
      </div>

      {/* Auto-assignment modal */}
      <AutoAssignModal
        isOpen={showAutoAssignModal}
        onClose={handleAutoAssignClose}
        onConfirm={handleAutoAssignConfirm}
        plannedAssignments={plannedAssignments}
        isProcessing={isAutoAssigning}
      />
    </div>
  );
}
