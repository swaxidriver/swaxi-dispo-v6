import { useState, useMemo } from "react";

import { useShifts } from "../contexts/useShifts";
import { useAuth } from "../contexts/useAuth";
import { getApplicationsByUser } from "../features/assignments/assignments";
import { APPLICATION_STATUS } from "../utils/constants";

/**
 * PersonalApplications - Personal application list for disponent users
 * Shows user's own applications with ability to withdraw before deadline
 */
export default function PersonalApplications() {
  const { state, withdrawApplication } = useShifts();
  const { user } = useAuth();
  const [withdrawing, setWithdrawing] = useState(new Set());

  // Get applications for current user
  const userApplications = useMemo(() => {
    if (!user?.id) return [];
    return getApplicationsByUser(user.id, state.applications || []);
  }, [user?.id, state.applications]);

  // Group applications by status
  const applicationsByStatus = useMemo(() => {
    const grouped = {
      pending: [],
      approved: [],
      rejected: [],
      withdrawn: [],
    };

    userApplications.forEach((app) => {
      const status = app.status || "pending";
      if (grouped[status]) {
        grouped[status].push(app);
      }
    });

    return grouped;
  }, [userApplications]);

  // Get shift details for an application
  const getShiftDetails = (application) => {
    const shift = state.shifts?.find((s) => s.id === application.shiftId);
    return (
      shift || { id: application.shiftId, date: "Unknown", type: "Unknown" }
    );
  };

  // Check if application can be withdrawn (before deadline)
  const canWithdraw = (application) => {
    const status = application.status || "pending";
    if (status !== "pending") return false;

    const shift = getShiftDetails(application);
    if (!shift.date) return false;

    // Allow withdrawal up to 24 hours before shift date
    const shiftDate = new Date(shift.date);
    const deadline = new Date(shiftDate.getTime() - 24 * 60 * 60 * 1000);
    const now = new Date();

    return now < deadline;
  };

  // Handle application withdrawal
  const handleWithdraw = async (applicationId) => {
    setWithdrawing((prev) => new Set(prev.add(applicationId)));

    try {
      await withdrawApplication(applicationId);
    } finally {
      setWithdrawing((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

  // Format application date for display
  const formatApplicationDate = (application) => {
    const date = application.ts ? new Date(application.ts) : null;
    return date ? date.toLocaleDateString("de-DE") : "Unknown";
  };

  // Render application row
  const renderApplication = (application) => {
    const shift = getShiftDetails(application);
    const canWithdrawApp = canWithdraw(application);
    const isWithdrawing = withdrawing.has(application.id);

    return (
      <tr key={application.id} className="border-b border-gray-200">
        <td className="px-4 py-3 text-sm">{shift.date}</td>
        <td className="px-4 py-3 text-sm">{shift.type}</td>
        <td className="px-4 py-3 text-sm">
          {shift.start} - {shift.end}
        </td>
        <td className="px-4 py-3 text-sm">
          {formatApplicationDate(application)}
        </td>
        <td className="px-4 py-3 text-sm">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              (application.status || "pending") === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : (application.status || "pending") === "approved"
                  ? "bg-green-100 text-green-800"
                  : (application.status || "pending") === "rejected"
                    ? "bg-red-100 text-red-800"
                    : (application.status || "pending") === "withdrawn"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-gray-100 text-gray-800"
            }`}
          >
            {(application.status || "pending") === "pending"
              ? "Ausstehend"
              : (application.status || "pending") === "approved"
                ? "Genehmigt"
                : (application.status || "pending") === "rejected"
                  ? "Abgelehnt"
                  : (application.status || "pending") === "withdrawn"
                    ? "Zurückgezogen"
                    : "Ausstehend"}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">
          {canWithdrawApp && (
            <button
              onClick={() => handleWithdraw(application.id)}
              disabled={isWithdrawing}
              className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              aria-label={`Bewerbung für ${shift.type} am ${shift.date} zurückziehen`}
            >
              {isWithdrawing ? "Wird zurückgezogen..." : "Zurückziehen"}
            </button>
          )}
        </td>
      </tr>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meine Bewerbungen</h1>
        <p className="text-gray-600">
          Bitte melden Sie sich an, um Ihre Bewerbungen zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Meine Bewerbungen
        </h1>
        <p className="text-gray-600">
          Übersicht Ihrer Dienstbewerbungen. Sie können ausstehende Bewerbungen
          bis 24 Stunden vor dem Dienst zurückziehen.
        </p>
      </div>

      {userApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine Bewerbungen vorhanden
          </h3>
          <p className="text-gray-500 mb-4">
            Sie haben sich noch für keinen Dienst beworben.
          </p>
          <a
            href="/calendar"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Verfügbare Dienste anzeigen
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Datum
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Typ
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Zeit
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Beworben am
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Pending applications first */}
                {applicationsByStatus.pending.map(renderApplication)}
                {/* Then approved */}
                {applicationsByStatus.approved.map(renderApplication)}
                {/* Then rejected */}
                {applicationsByStatus.rejected.map(renderApplication)}
                {/* Finally withdrawn */}
                {applicationsByStatus.withdrawn.map(renderApplication)}
              </tbody>
            </table>
          </div>

          {/* Summary statistics */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                <strong className="text-gray-900">
                  {applicationsByStatus.pending.length}
                </strong>{" "}
                Ausstehend
              </span>
              <span>
                <strong className="text-gray-900">
                  {applicationsByStatus.approved.length}
                </strong>{" "}
                Genehmigt
              </span>
              <span>
                <strong className="text-gray-900">
                  {applicationsByStatus.rejected.length}
                </strong>{" "}
                Abgelehnt
              </span>
              <span>
                <strong className="text-gray-900">
                  {applicationsByStatus.withdrawn.length}
                </strong>{" "}
                Zurückgezogen
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
