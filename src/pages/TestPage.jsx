import { useState } from "react";

// useShifts is defined in its own hook file, not exported from ShiftContext.jsx
import { useShifts } from "../contexts/useShifts";
import { sharePointService } from "../services/sharePointService";
import TokenExample from "../components/TokenExample";
import FormValidationDemo from "../components/FormValidationDemo";
import { useTimeFormat } from "../hooks/useTimeFormat";

export default function TestPage() {
  const { state } = useShifts();
  const { formatDateTime } = useTimeFormat();
  // Local helpers since ShiftContext doesn't expose these directly yet
  const testConnection = async () => sharePointService.isSharePointAvailable();
  const createShift = async (shift) => sharePointService.createShift(shift);
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const [showFormDemo, setShowFormDemo] = useState(false);

  const addTestResult = (test, result, details = "") => {
    setTestResults((prev) => [
      ...prev,
      {
        test,
        result,
        details,
        timestamp: new Date(),
      },
    ]);
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);

    // Test 1: SharePoint availability
    try {
      const isOnline = await sharePointService.isSharePointAvailable();
      addTestResult(
        "SharePoint Verfügbarkeit",
        isOnline ? "PASS" : "FAIL",
        isOnline
          ? "SharePoint ist erreichbar"
          : "SharePoint nicht verfügbar - localStorage wird verwendet",
      );
    } catch (error) {
      addTestResult("SharePoint Verfügbarkeit", "ERROR", error.message);
    }

    // Test 2: Data loading
    try {
      const shifts = await sharePointService.getShifts();
      addTestResult(
        "Daten laden",
        "PASS",
        `${shifts.length} Schichten geladen (${state.dataSource})`,
      );
    } catch (error) {
      addTestResult("Daten laden", "ERROR", error.message);
    }

    // Test 3: Create test shift
    try {
      const testShift = {
        date: new Date(),
        start: "09:00",
        end: "17:00",
        type: "test",
        status: "open",
        workLocation: "office",
      };

      const newShift = await createShift(testShift);
      addTestResult(
        "Schicht erstellen",
        "PASS",
        `Test-Schicht erstellt (ID: ${newShift.id})`,
      );
    } catch (error) {
      addTestResult("Schicht erstellen", "ERROR", error.message);
    }

    // Test 4: Audit logging
    try {
      await sharePointService.logAudit("TEST_AUDIT", { test: true });
      addTestResult(
        "Audit Protokoll",
        "PASS",
        "Test-Eintrag im Audit-Log erstellt",
      );
    } catch (_error) {
      addTestResult("Audit Protokoll", "INFO", "Läuft im localStorage-Modus");
    }

    setTesting(false);
  };

  const exportData = () => {
    const data = {
      state,
      testResults,
      timestamp: new Date(),
      browser: navigator.userAgent,
      url: window.location.href,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `swaxi-test-results-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Hybrid-Modus Testen</h1>

        {/* Design Token Examples */}
        <div className="mb-8">
          <TokenExample />
        </div>

        {/* Current Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-xl font-semibold mb-4">Aktueller Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Datenquelle</div>
              <div className="text-lg font-semibold">
                {state.dataSource === "sharePoint"
                  ? "🟢 SharePoint"
                  : "🟡 localStorage"}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Online Status</div>
              <div className="text-lg font-semibold">
                {state.isOnline ? "✅ Online" : "⚠️ Offline"}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Schichten</div>
              <div className="text-lg font-semibold">
                {state.shifts.length} geladen
              </div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-xl font-semibold mb-4">Tests ausführen</h2>
          <div className="flex space-x-4">
            <button
              onClick={runAllTests}
              disabled={testing}
              className="btn-primary"
            >
              {testing ? "🔄 Tests laufen..." : "🚀 Alle Tests starten"}
            </button>

            <button onClick={testConnection} className="btn-secondary">
              🔗 Verbindung testen
            </button>

            <button onClick={exportData} className="btn-secondary">
              💾 Ergebnisse exportieren
            </button>

            <button
              onClick={() => setShowFormDemo(!showFormDemo)}
              className="btn-secondary"
            >
              📝 Form Validation Demo {showFormDemo ? "ausblenden" : "anzeigen"}
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Test-Ergebnisse</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border-l-4 ${
                    result.result === "PASS"
                      ? "border-green-500 bg-green-50"
                      : result.result === "FAIL"
                        ? "border-red-500 bg-red-50"
                        : result.result === "ERROR"
                          ? "border-red-500 bg-red-50"
                          : "border-blue-500 bg-blue-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{result.test}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.details}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        result.result === "PASS"
                          ? "bg-green-100 text-green-800"
                          : result.result === "FAIL"
                            ? "bg-red-100 text-red-800"
                            : result.result === "ERROR"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {result.result}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {formatDateTime(result.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Validation Demo */}
        {showFormDemo && (
          <div className="mt-8">
            <FormValidationDemo />
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Wie funktioniert der Hybrid-Modus?
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li>
              • <strong>Lokal:</strong> Läuft mit localStorage (wie bisher)
            </li>
            <li>
              • <strong>Stadtwerke Netzwerk:</strong> Erkennt automatisch
              SharePoint
            </li>
            <li>
              • <strong>Fallback:</strong> Wechselt nahtlos zwischen beiden Modi
            </li>
            <li>
              • <strong>Synchronisation:</strong> Daten werden automatisch
              gesichert
            </li>
            <li>
              • <strong>SharePoint Status:</strong> Aktuell ist die direkte
              SharePoint-Anbindung im Demonstrationsmodus (Mock). Reale
              Verbindung wird in einer späteren Iteration aktiviert.
            </li>
          </ul>
          <div className="mt-4 text-xs text-blue-700" role="note">
            Geplante Schritte: Authentifizierung, sichere API-Brücke,
            differenziertes Konflikt-Merging.
          </div>
        </div>
      </div>
    </div>
  );
}
