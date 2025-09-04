import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Calendar from "../pages/Calendar";
import Administration from "../pages/Administration";
import Audit from "../pages/Audit";
import Settings from "../pages/Settings";
import TestPage from "../pages/TestPage";
import ShiftDesigner from "../pages/ShiftDesigner";
import PersonalApplications from "../pages/PersonalApplications";
import { Login } from "../features/people";

/**
 * AppRoutes component that defines all application routes.
 * Extracted from App.jsx to separate routing concerns.
 *
 * @param {Object} props
 * @param {boolean} props.ready - Whether the app is ready to render routes
 */
function AppRoutes({ ready }) {
  if (!ready) {
    return (
      <div role="status" aria-live="polite" aria-label="Anwendung wird geladen">
        <LoadingSkeleton />
        <span className="sr-only">Anwendung wird geladen, bitte warten...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/applications" element={<PersonalApplications />} />
      <Route path="/admin" element={<Administration />} />
      <Route path="/shift-designer" element={<ShiftDesigner />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

/**
 * Loading skeleton component for displaying while the app initializes.
 * Moved here from App.jsx to keep it close to its usage.
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-6 bg-gray-300 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  );
}

export default AppRoutes;
