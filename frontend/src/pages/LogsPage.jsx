import React from 'react';
import { useLogsStore } from '../store';

const LogsPage = () => {
  const logs = useLogsStore((state) => state.logs);
  const stats = useLogsStore((state) => state.stats);
  const filter = useLogsStore((state) => state.filter);
  const setFilter = useLogsStore((state) => state.setFilter);
  const clearLogs = useLogsStore((state) => state.clearLogs);
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredLogs = logs.filter((log) => {
    if (filter.level && log.level !== filter.level) return false;
    if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return '#ef4444';
      case 'warn':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getLevelBgColor = (level) => {
    switch (level) {
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      case 'warn':
        return 'rgba(245, 158, 11, 0.1)';
      case 'info':
        return 'rgba(59, 130, 246, 0.1)';
      default:
        return 'rgba(107, 114, 128, 0.1)';
    }
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-xl font-bold mb-6">Application Logs</h1>
      
      <div className="bg-secondary border border-border rounded-lg p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
          <h2>📋 Application Logs</h2>
          <div className="flex gap-8">
            <div className="text-center">
              <span className="text-sm text-secondary">Total</span>
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-secondary">Info</span>
              <span className="text-2xl font-bold text-blue-500">{stats.info}</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-secondary">Warn</span>
              <span className="text-2xl font-bold text-yellow-500">{stats.warn}</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-secondary">Error</span>
              <span className="text-2xl font-bold text-red-500">{stats.error}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-auto-fit gap-4 mb-8 bg-secondary border border-border rounded-lg p-4">
          <div className="flex flex-col gap-2">
            <label>Filter by Level:</label>
            <select value={filter.level || ''} onChange={(e) => setFilter({ level: e.target.value || null })} className="p-3 border border-border rounded-md bg-tertiary text-primary">
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label>Search:</label>
            <input type="text" value={filter.search} onChange={(e) => setFilter({ search: e.target.value })} placeholder="Search logs..." className="p-3 border border-border rounded-md bg-tertiary text-primary w-full" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="mr-2" />
            <label>Auto Scroll</label>
          </div>
          <button onClick={clearLogs} className="p-3 bg-danger text-white rounded-md font-medium">
            🗑️ Clear Logs
          </button>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-4 flex flex-col gap-2 max-h-[calc(100vh-400px)] overflow-y-auto font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-tertiary p-8">
              <p>No logs to display</p>
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div key={idx} 
                   className="p-3 rounded-md"
                   style={{ backgroundColor: getLevelBgColor(log.level), borderLeft: `3px solid ${getLevelColor(log.level)}` }}>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-xs font-bold text-uppercase" 
                        style={{ color: getLevelColor(log.level) }}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-xs text-tertiary">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-primary word-break">{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsPage;