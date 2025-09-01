import { useState, useEffect, useRef } from "react";

// Corrected import: useShifts is defined in its own hook file, not exported from ShiftContext
import { useShifts } from "../contexts/useShifts";
import { useI18n } from "../hooks/useI18n";
import { useTimeFormat } from "../hooks/useTimeFormat";

const DEFAULT_AUTOSAVE_INTERVAL = 30000; // 30 seconds
const DEFAULT_MAX_SNAPSHOTS = 10; // Keep last 10 snapshots

/**
 * AutosaveManager
 * Responsibilities:
 *  - Periodically snapshot relevant shift/application/notification state to localStorage (ring buffer limited)
 *  - Offer recovery UI when unsaved work + recent snapshot present
 *  - Export & housekeeping (cleanup oldest) actions
 * Known limitations (acceptable for now):
 *  - Snapshot diffing heuristic is simplistic (signature by lengths); could hash payload for deeper dedupe.
 */
export default function AutosaveManager({
  intervalMs = DEFAULT_AUTOSAVE_INTERVAL,
  maxSnapshots = DEFAULT_MAX_SNAPSHOTS,
  enableLogging = false,
  dedupeSnapshots = false, // if true, identical (by simple signature) consecutive snapshots are skipped
} = {}) {
  const { state, restoreFromSnapshot } = useShifts();
  const { t } = useI18n();
  const { formatDateTime } = useTimeFormat();
  const [lastSave, setLastSave] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [availableSnapshots, setAvailableSnapshots] = useState([]);
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false);
  const lastSignatureRef = useRef(null);

  // Auto-save functionality
  useEffect(() => {
    const saveSnapshot = () => {
      try {
        // Build a simple signature to avoid redundant identical snapshots
        const signature = [
          state.shifts.length,
          state.applications.length,
          state.notifications.length,
          state.lastActivity || 0,
        ].join(":");
        if (dedupeSnapshots) {
          if (signature === lastSignatureRef.current) return;
          lastSignatureRef.current = signature;
        }

        const now = Date.now();
        const dataSource =
          typeof state.dataSource === "string"
            ? state.dataSource
            : state.dataSource?.source || "localStorage";

        const snapshot = {
          id: now,
          timestamp: new Date(now).toISOString(),
          data: {
            shifts: state.shifts,
            applications: state.applications,
            notifications: state.notifications,
            lastActivity: state.lastActivity,
          },
          dataSource,
          changeCount: state.shifts.length + state.applications.length,
        };

        const existingSnapshots = JSON.parse(
          localStorage.getItem("swaxi-autosave-snapshots") || "[]",
        );
        const updatedSnapshots = [snapshot, ...existingSnapshots].slice(
          0,
          maxSnapshots,
        );

        localStorage.setItem(
          "swaxi-autosave-snapshots",
          JSON.stringify(updatedSnapshots),
        );
        localStorage.setItem(
          "swaxi-last-autosave",
          JSON.stringify({
            timestamp: snapshot.timestamp,
            changeCount: snapshot.changeCount,
          }),
        );

        setLastSave(new Date(snapshot.timestamp));
        setAvailableSnapshots(updatedSnapshots);
        if (enableLogging)
          console.log("📸 Autosave: Snapshot erstellt", snapshot.id);
      } catch (error) {
        if (enableLogging) console.error("❌ Autosave Fehler:", error);
      }
    };

    // Initial save (after mount / state updates)
    saveSnapshot();
    const interval = setInterval(saveSnapshot, intervalMs);
    return () => clearInterval(interval);
  }, [
    state.shifts,
    state.applications,
    state.notifications,
    state.dataSource,
    state.lastActivity,
    intervalMs,
    maxSnapshots,
    enableLogging,
    dedupeSnapshots,
  ]);

  // Load snapshots on component mount
  useEffect(() => {
    try {
      const snapshots = JSON.parse(
        localStorage.getItem("swaxi-autosave-snapshots") || "[]",
      );
      setAvailableSnapshots(snapshots);

      const lastSaveInfo = JSON.parse(
        localStorage.getItem("swaxi-last-autosave") || "null",
      );
      if (lastSaveInfo) {
        setLastSave(new Date(lastSaveInfo.timestamp));
      }
    } catch (error) {
      console.error("Error loading snapshots:", error);
    }
  }, []);

  // Check for recovery on app start
  useEffect(() => {
    const checkForRecovery = () => {
      try {
        const hasUnsavedWork = localStorage.getItem("swaxi-unsaved-work");
        const snapshots = JSON.parse(
          localStorage.getItem("swaxi-autosave-snapshots") || "[]",
        );

        if (hasUnsavedWork && snapshots.length > 0) {
          const lastSnapshot = snapshots[0];
          const timeSinceLastSnapshot =
            Date.now() - new Date(lastSnapshot.timestamp).getTime();

          // If last snapshot is recent (< 5 minutes), offer recovery
          if (timeSinceLastSnapshot < 300000) {
            setShowRecoveryPanel(true);
          }
        }
      } catch (error) {
        console.error("Error checking for recovery:", error);
      }
    };

    // Check after a short delay to let the app initialize
    setTimeout(checkForRecovery, 1000);
  }, []);

  const recoverFromSnapshot = async (snapshotId) => {
    try {
      setIsRecovering(true);
      const snapshot = availableSnapshots.find((s) => s.id === snapshotId);

      if (!snapshot) {
        throw new Error("Snapshot nicht gefunden");
      }

      console.log("🔄 Wiederherstellung von Snapshot:", snapshot);
      restoreFromSnapshot(snapshot);
      // Simulate minor delay for UX feedback
      await new Promise((resolve) => setTimeout(resolve, 400));

      setShowRecoveryPanel(false);
      setIsRecovering(false);

      // Clear unsaved work flag
      localStorage.removeItem("swaxi-unsaved-work");

      alert(
        `✅ ${t("dataRestoreSuccess") || "Daten erfolgreich wiederhergestellt"}!\n\n${t("snapshotFrom") || "Snapshot vom"}: ${formatDateTime(new Date(snapshot.timestamp))}\n${t("dataSource") || "Datenquelle"}: ${snapshot.dataSource}`,
      );
    } catch (error) {
      console.error("❌ Wiederherstellung fehlgeschlagen:", error);
      alert(
        `❌ ${t("dataRestoreFailed") || "Wiederherstellung fehlgeschlagen"}: ` +
          error.message,
      );
      setIsRecovering(false);
    }
  };

  const deleteSnapshot = (snapshotId) => {
    try {
      const updatedSnapshots = availableSnapshots.filter(
        (s) => s.id !== snapshotId,
      );
      localStorage.setItem(
        "swaxi-autosave-snapshots",
        JSON.stringify(updatedSnapshots),
      );
      setAvailableSnapshots(updatedSnapshots);
    } catch (error) {
      console.error("Error deleting snapshot:", error);
    }
  };

  const exportSnapshots = () => {
    try {
      const exportData = {
        snapshots: availableSnapshots,
        exportTime: new Date().toISOString(),
        version: "6.0.0",
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `swaxi-snapshots-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "gerade eben";
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    return time.toLocaleDateString("de-DE");
  };

  // Recovery Panel
  // Recovery overlay (keep separate so indicator still mounts for consistent layout if needed later)
  const recoveryOverlay = showRecoveryPanel && (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      data-testid="recovery-overlay"
    >
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <span className="text-2xl">🔄</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ungespeicherte Änderungen erkannt
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Es wurden automatische Snapshots gefunden. Möchten Sie Ihre Arbeit
            wiederherstellen?
          </p>

          <div className="max-h-48 overflow-y-auto mb-4 text-left">
            {availableSnapshots.slice(0, 5).map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-center justify-between p-3 border rounded-md mb-2"
              >
                <div>
                  <div className="text-sm font-medium">
                    {formatDateTime(new Date(snapshot.timestamp))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {snapshot.data.shifts.length} Dienste •{" "}
                    {snapshot.dataSource}
                  </div>
                </div>
                <button
                  onClick={() => recoverFromSnapshot(snapshot.id)}
                  disabled={isRecovering}
                  className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white btn-primary disabled:opacity-50"
                >
                  {isRecovering ? "Lädt..." : "Wiederherstellen"}
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button
              onClick={() => setShowRecoveryPanel(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              data-testid="recovery-skip"
            >
              Überspringen
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("swaxi-unsaved-work");
                setShowRecoveryPanel(false);
              }}
              className="btn btn-primary px-4 py-2"
            >
              Neu beginnen
            </button>
            <button
              onClick={exportSnapshots}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Export
            </button>
            {availableSnapshots.length > 3 && (
              <button
                onClick={() =>
                  deleteSnapshot(
                    availableSnapshots[availableSnapshots.length - 1].id,
                  )
                }
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Bereinigen
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {availableSnapshots.length} Snapshots verfügbar
          </div>
        </div>
      </div>
    </div>
  );

  // Auto-save status indicator (shown in corner)
  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">
              Autosave:{" "}
              {lastSave ? formatTimeAgo(lastSave) : "Initialisierung..."}
            </span>
            <button
              onClick={() => setShowRecoveryPanel(true)}
              className="text-xs text-[var(--color-primary)] hover:opacity-80"
              title="Snapshots verwalten"
            >
              📸
            </button>
          </div>
          {availableSnapshots.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              {availableSnapshots.length} Snapshots verfügbar
            </div>
          )}
        </div>
      </div>
      {recoveryOverlay}
    </>
  );
}
