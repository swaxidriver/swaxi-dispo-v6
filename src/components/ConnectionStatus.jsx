import { useState } from 'react';
import { useShifts } from '../contexts/ShiftContext';

export default function ConnectionStatus() {
  const { state, testConnection } = useShifts();
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const isOnline = await testConnection();
      console.log('Connection test result:', isOnline ? 'SharePoint available' : 'SharePoint not available');
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (state.dataSource === 'sharePoint' && state.isOnline) {
      return '🟢'; // Green - SharePoint connected
    } else if (state.dataSource === 'localStorage') {
      return '🟡'; // Yellow - localStorage mode
    } else {
      return '🔴'; // Red - error state
    }
  };

  const getStatusText = () => {
    if (state.dataSource === 'sharePoint' && state.isOnline) {
      return 'SharePoint verbunden';
    } else if (state.dataSource === 'localStorage') {
      return 'Offline-Modus (localStorage)';
    } else {
      return 'Verbindungsfehler';
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
      </div>
      
      {state.lastSync && (
        <span className="text-xs text-gray-500">
          Letzte Sync: {state.lastSync.toLocaleTimeString('de-DE')}
        </span>
      )}
      
      <button
        onClick={handleTestConnection}
        disabled={testing}
        className="btn-secondary text-xs px-2 py-1"
      >
        {testing ? '🔄 Test läuft...' : '🔗 Verbindung testen'}
      </button>

      {/* Development Info */}
      {state.dataSource === 'localStorage' && (
        <div className="text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded">
          💡 Tipp: Funktioniert automatisch im Stadtwerke-Netzwerk
        </div>
      )}
    </div>
  );
}
