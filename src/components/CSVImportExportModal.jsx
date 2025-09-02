/**
 * CSV Import/Export Modal Component
 *
 * Provides UI for importing people and shift templates from CSV,
 * and exporting assignments in various formats including Perdis/WebComm.
 */

import { useState, useRef } from "react";
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

import {
  importPeople,
  importShiftTemplates,
  exportAssignments,
  exportPeople,
  exportShiftTemplates,
  exportPerdisWebComm,
} from "../integration/csv.js";

const CSVImportExportModal = ({ isOpen, onClose, repository }) => {
  const [activeTab, setActiveTab] = useState("import");
  const [importType, setImportType] = useState("people");
  const [exportType, setExportType] = useState("assignments");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setResult(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setResult({
        success: false,
        message: "Please select a CSV file",
        errors: ["Invalid file type. Only CSV files are supported."],
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const content = await file.text();
      let importResult;

      if (importType === "people") {
        importResult = await importPeople(content, repository);
      } else if (importType === "templates") {
        importResult = await importShiftTemplates(content, repository);
      }

      const success = importResult.errors.length === 0;
      setResult({
        success,
        message: success
          ? `Successfully processed ${importResult.processed} rows: ${importResult.created} created, ${importResult.updated} updated`
          : `Processed ${importResult.processed} rows with ${importResult.errors.length} errors`,
        details: importResult,
        errors: importResult.errors,
      });
    } catch (error) {
      setResult({
        success: false,
        message: "Import failed",
        errors: [error.message],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (exportType === "assignments" || exportType === "perdis") {
      if (!weekStart || !weekEnd) {
        setResult({
          success: false,
          message: "Please select a date range for assignment export",
          errors: [
            "Start date and end date are required for assignment exports",
          ],
        });
        return;
      }
    }

    setIsProcessing(true);
    setResult(null);

    try {
      let csvContent;
      let filename;

      switch (exportType) {
        case "people":
          csvContent = await exportPeople(repository);
          filename = "people.csv";
          break;
        case "templates":
          csvContent = await exportShiftTemplates(repository);
          filename = "shift_templates.csv";
          break;
        case "assignments":
          csvContent = await exportAssignments(
            repository,
            new Date(weekStart),
            new Date(weekEnd),
          );
          filename = `assignments_${weekStart}_${weekEnd}.csv`;
          break;
        case "perdis":
          csvContent = await exportPerdisWebComm(
            repository,
            new Date(weekStart),
            new Date(weekEnd),
          );
          filename = `perdis_webcomm_${weekStart}_${weekEnd}.csv`;
          break;
        default:
          throw new Error("Invalid export type");
      }

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setResult({
        success: true,
        message: `Successfully exported ${filename}`,
        details: { filename, size: blob.size },
      });
    } catch (error) {
      setResult({
        success: false,
        message: "Export failed",
        errors: [error.message],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const setCurrentWeek = () => {
    const week = getCurrentWeek();
    setWeekStart(week.start);
    setWeekEnd(week.end);
  };

  const getSampleCSV = () => {
    switch (importType) {
      case "people":
        return `name,email,role
John Doe,john@example.com,admin
Jane Smith,jane@example.com,disponent
Bob Johnson,bob@example.com,analyst`;
      case "templates":
        return `name,start_time,end_time,weekday_mask,cross_midnight,color
Morning Shift,08:00,16:00,31,false,#222f88
Night Shift,22:00,06:00,127,true,#dc2626
Weekend Early,06:00,14:00,96,false,#16a34a`;
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            CSV Import/Export
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => {
                setActiveTab("import");
                resetState();
              }}
              className={`px-6 py-3 font-medium ${
                activeTab === "import"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ArrowUpTrayIcon className="h-5 w-5 inline mr-2" />
              Import
            </button>
            <button
              onClick={() => {
                setActiveTab("export");
                resetState();
              }}
              className={`px-6 py-3 font-medium ${
                activeTab === "export"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ArrowDownTrayIcon className="h-5 w-5 inline mr-2" />
              Export
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Import Tab */}
          {activeTab === "import" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Type
                </label>
                <select
                  value={importType}
                  onChange={(e) => {
                    setImportType(e.target.value);
                    resetState();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="people">People (Disponenten)</option>
                  <option value="templates">Shift Templates</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileImport}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* Sample CSV Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected CSV Format
                </label>
                <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                  {getSampleCSV()}
                </pre>
              </div>

              {/* Import Instructions */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">
                  Import Instructions
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {importType === "people" ? (
                    <>
                      <li>• CSV must include columns: name, email</li>
                      <li>
                        • Role is optional (defaults to &apos;disponent&apos;)
                      </li>
                      <li>• Valid roles: admin, chief, disponent, analyst</li>
                      <li>• Existing people are updated by email (upsert)</li>
                    </>
                  ) : (
                    <>
                      <li>• CSV must include: name, start_time, end_time</li>
                      <li>
                        • Use either weekday_mask (number) or days
                        (Mo,Tu,We,Th,Fr,Sa,Su)
                      </li>
                      <li>• Times in HH:MM format (24-hour)</li>
                      <li>
                        • cross_midnight auto-detected if end_time &lt;
                        start_time
                      </li>
                      <li>• Existing templates updated by name (upsert)</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === "export" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Type
                </label>
                <select
                  value={exportType}
                  onChange={(e) => {
                    setExportType(e.target.value);
                    resetState();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="people">People (Disponenten)</option>
                  <option value="templates">Shift Templates</option>
                  <option value="assignments">Assignments (Weekly)</option>
                  <option value="perdis">Perdis/WebComm Format</option>
                </select>
              </div>

              {/* Date Range for Assignments */}
              {(exportType === "assignments" || exportType === "perdis") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Week Start
                    </label>
                    <input
                      type="date"
                      value={weekStart}
                      onChange={(e) => setWeekStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Week End
                    </label>
                    <input
                      type="date"
                      value={weekEnd}
                      onChange={(e) => setWeekEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={setCurrentWeek}
                      className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Current Week
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isProcessing ? "Exporting..." : "Export CSV"}
                </button>
              </div>

              {/* Export Information */}
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-medium text-green-900 mb-2">
                  Export Information
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  {exportType === "assignments" ? (
                    <>
                      <li>• Includes cross-midnight flags and paid hours</li>
                      <li>• Shows assignment status and person details</li>
                      <li>• Calculated duration in minutes and hours</li>
                    </>
                  ) : exportType === "perdis" ? (
                    <>
                      <li>• Compatible with Perdis/WebComm systems</li>
                      <li>• Includes PersonalNr, midnight flags, hours</li>
                      <li>• Only exports assigned shifts</li>
                    </>
                  ) : exportType === "people" ? (
                    <>
                      <li>• Exports all people with roles and timestamps</li>
                      <li>• Can be re-imported for backup/restore</li>
                    </>
                  ) : (
                    <>
                      <li>• Exports all shift templates with configurations</li>
                      <li>
                        • Includes weekday masks and cross-midnight settings
                      </li>
                      <li>• Can be re-imported for backup/restore</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div
              className={`mt-6 p-4 rounded-md ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div
                className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}
              >
                {result.message}
              </div>

              {result.details && activeTab === "import" && (
                <div className="mt-2 text-sm text-gray-600">
                  <div>Processed: {result.details.processed}</div>
                  <div>Created: {result.details.created}</div>
                  <div>Updated: {result.details.updated}</div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-red-800 mb-1">
                    Errors:
                  </div>
                  <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="mt-6 flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {activeTab === "import"
                  ? "Processing import..."
                  : "Generating export..."}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSVImportExportModal;
