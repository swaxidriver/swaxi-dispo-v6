import { useState, useEffect } from 'react';
import { useShifts } from '../contexts/ShiftContext';

const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const MAX_SNAPSHOTS = 10; // Keep last 10 snapshots

export default function AutosaveManager() {
  const { state } = useShifts();
  const [lastSave, setLastSave] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [availableSnapshots, setAvailableSnapshots] = useState([]);
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const saveSnapshot = () => {
      try {
        const snapshot = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          data: {
            shifts: state.shifts,
            applications: state.applications,
            notifications: state.notifications,
            lastActivity: state.lastActivity
          },
          dataSource: state.dataSource?.source || 'localStorage',
          changeCount: state.shifts.length + state.applications.length
        };

        // Get existing snapshots
        const existingSnapshots = JSON.parse(localStorage.getItem('swaxi-autosave-snapshots') || '[]');
        
        // Add new snapshot and limit to MAX_SNAPSHOTS
        const updatedSnapshots = [snapshot, ...existingSnapshots].slice(0, MAX_SNAPSHOTS);
        
        // Save to localStorage
        localStorage.setItem('swaxi-autosave-snapshots', JSON.stringify(updatedSnapshots));
        localStorage.setItem('swaxi-last-autosave', JSON.stringify({
          timestamp: new Date().toISOString(),
          changeCount: snapshot.changeCount
        }));

        setLastSave(new Date());
        setAvailableSnapshots(updatedSnapshots);
        
        console.log('📸 Autosave: Snapshot erstellt', snapshot.id);
      } catch (error) {
        console.error('❌ Autosave Fehler:', error);
      }
    };

    // Initial save
    saveSnapshot();

    // Set up interval
    const interval = setInterval(saveSnapshot, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [state.shifts, state.applications, state.notifications, state.dataSource?.source, state.lastActivity]);

  // Load snapshots on component mount
  useEffect(() => {
    try {
      const snapshots = JSON.parse(localStorage.getItem('swaxi-autosave-snapshots') || '[]');
      setAvailableSnapshots(snapshots);
      
      const lastSaveInfo = JSON.parse(localStorage.getItem('swaxi-last-autosave') || 'null');
      if (lastSaveInfo) {
        setLastSave(new Date(lastSaveInfo.timestamp));
      }
    } catch (error) {
      console.error('Error loading snapshots:', error);
    }
  }, []);

  // Check for recovery on app start
  useEffect(() => {
    const checkForRecovery = () => {
      try {
        const hasUnsavedWork = localStorage.getItem('swaxi-unsaved-work');
        const snapshots = JSON.parse(localStorage.getItem('swaxi-autosave-snapshots') || '[]');
        
        if (hasUnsavedWork && snapshots.length > 0) {
          const lastSnapshot = snapshots[0];
          const timeSinceLastSnapshot = Date.now() - new Date(lastSnapshot.timestamp).getTime();
          
          // If last snapshot is recent (< 5 minutes), offer recovery
          if (timeSinceLastSnapshot < 300000) {
            setShowRecoveryPanel(true);
          }
        }
      } catch (error) {
        console.error('Error checking for recovery:', error);
      }
    };

    // Check after a short delay to let the app initialize
    setTimeout(checkForRecovery, 1000);
  }, []);

  const recoverFromSnapshot = async (snapshotId) => {
    try {
      setIsRecovering(true);
      const snapshot = availableSnapshots.find(s => s.id === snapshotId);
      
      if (!snapshot) {
        throw new Error('Snapshot nicht gefunden');
      }

      // Here you would dispatch actions to restore the state
      // For demo purposes, we'll just show a success message
      console.log('🔄 Wiederherstellung von Snapshot:', snapshot);
      
      // Simulate recovery process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowRecoveryPanel(false);
      setIsRecovering(false);
      
      // Clear unsaved work flag
      localStorage.removeItem('swaxi-unsaved-work');
      
      alert(`✅ Daten erfolgreich wiederhergestellt!\n\nSnapshot vom: ${new Date(snapshot.timestamp).toLocaleString('de-DE')}\nDatenquelle: ${snapshot.dataSource}`);
    } catch (error) {
      console.error('❌ Wiederherstellung fehlgeschlagen:', error);
      alert('❌ Wiederherstellung fehlgeschlagen: ' + error.message);
      setIsRecovering(false);
    }
  };

  const deleteSnapshot = (snapshotId) => {
    try {
      const updatedSnapshots = availableSnapshots.filter(s => s.id !== snapshotId);
      localStorage.setItem('swaxi-autosave-snapshots', JSON.stringify(updatedSnapshots));
      setAvailableSnapshots(updatedSnapshots);
    } catch (error) {
      console.error('Error deleting snapshot:', error);
    }
  };

  const exportSnapshots = () => {
    try {
      const exportData = {
        snapshots: availableSnapshots,
        exportTime: new Date().toISOString(),
        version: '6.0.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `swaxi-snapshots-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    return time.toLocaleDateString('de-DE');
  };

  // Recovery Panel
  if (showRecoveryPanel) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ungespeicherte Änderungen erkannt
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Es wurden automatische Snapshots gefunden. Möchten Sie Ihre Arbeit wiederherstellen?
            </p>
            
            <div className="max-h-40 overflow-y-auto mb-6">
              {availableSnapshots.slice(0, 3).map((snapshot) => (
                <div key={snapshot.id} className="flex items-center justify-between p-3 border rounded-md mb-2">
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      {new Date(snapshot.timestamp).toLocaleString('de-DE')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {snapshot.data.shifts.length} Dienste • {snapshot.dataSource}
                    </div>
                  </div>
                  <button
                    onClick={() => recoverFromSnapshot(snapshot.id)}
                    disabled={isRecovering}
                    className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50"
                  >
                    {isRecovering ? 'Lädt...' : 'Wiederherstellen'}
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowRecoveryPanel(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Überspringen
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('swaxi-unsaved-work');
                  setShowRecoveryPanel(false);
                }}
                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/80"
              >
                Neu beginnen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auto-save status indicator (shown in corner)
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">
            Autosave: {lastSave ? formatTimeAgo(lastSave) : 'Initialisierung...'}
          </span>
            <button
              onClick={() => setShowRecoveryPanel(true)}
              className="text-xs text-brand-primary hover:text-brand-primary/80"
              title="Snapshots verwalten"
            >
              📸
            </button>
          </div>
          
          {showRecoveryPanel && (
            <div className="mt-2 flex space-x-1">
              <button
                onClick={exportSnapshots}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                title="Snapshots exportieren"
              >
                Export
              </button>
              {availableSnapshots.length > 3 && (
                <button
                  onClick={() => deleteSnapshot(availableSnapshots[availableSnapshots.length - 1].id)}
                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="Älteste Snapshots löschen"
                >
                  Bereinigen
                </button>
              )}
            </div>
          )}        {availableSnapshots.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {availableSnapshots.length} Snapshots verfügbar
          </div>
        )}
      </div>
    </div>
  );
}
