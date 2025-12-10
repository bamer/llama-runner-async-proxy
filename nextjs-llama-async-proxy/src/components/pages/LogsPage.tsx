const LogsPage = () => {
  const mockLogs = [
    { level: 'info', message: 'Model loading started for llama-2-7b-chat', timestamp: '2025-01-01T10:00:00Z', source: 'model-manager' },
    { level: 'debug', message: 'GPU memory allocation completed', timestamp: '2025-01-01T10:00:00Z', source: 'gpu-manager' },
    { level: 'warning', message: 'Memory usage approaching 80%', timestamp: '2025-01-01T10:01:00Z', source: 'system-monitor' },
    { level: 'error', message: 'Failed to load model llama-3-8b', timestamp: '2025-01-01T10:02:00Z', source: 'model-manager' },
    { level: 'info', message: 'New log entry added', timestamp: '2025-01-01T10:03:00Z', source: 'log-manager' }
  ];

  return (
    <div className="logs-page">
      <h1 className="text-2xl font-bold mb-6">Logs</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Filter logs..." 
            className="border border-border rounded-md px-4 py-2"
          />
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Clear Logs</button>
        </div>
        
        <div className="flex gap-2">
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">50</button>
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">100</button>
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">200</button>
        </div>
      </div>

      <div className="bg-secondary border border-border rounded-lg p-6">
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {mockLogs.map((log, index) => (
            <div key={index} className={`p-2 border rounded-md ${log.level === 'error' ? 'bg-red-500/10' : log.level === 'warning' ? 'bg-yellow-500/10' : 'bg-gray-500/10'}`}>
              <div className="flex justify-between">
                <span className={`font-mono ${log.level === 'error' ? 'text-red-400' : log.level === 'warning' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {log.level.toUpperCase()} - {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-xs opacity-50">{log.source}</span>
              </div>
              <p className="mt-1 font-mono text-sm">{log.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogsPage;