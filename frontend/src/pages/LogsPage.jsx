import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    // Mock data - in real implementation would connect to API
    const mockLogs = [
      { level: 'info', message: 'Model loading started for llama-2-7b-chat', timestamp: '2025-01-01T10:00:00Z', source: 'model-manager' },
      { level: 'debug', message: 'GPU memory allocation completed', timestamp: '2025-01-01T10:00:00Z', source: 'gpu-manager' },
      { level: 'warning', message: 'Memory usage approaching 80%', timestamp: '2025-01-01T10:01:00Z', source: 'system-monitor' },
      { level: 'error', message: 'Failed to load model llama-3-8b', timestamp: '2025-01-01T10:02:00Z', source: 'model-manager' },
      { level: 'info', message: 'New log entry added', timestamp: '2025-01-01T10:03:00Z', source: 'log-manager' }
    ];
    
    setLogs(mockLogs);
    setIsLoading(false);
  }, [limit]);

  const handleClearLogs = () => {
    // Mock logic - in real implementation would connect to API
    setLogs([]);
  };

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(filter.toLowerCase()) || 
    log.level.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="logs-page">
      <h1 className="text-2xl font-bold mb-6">Logs</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Input 
            placeholder="Filter logs..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Button variant="outline" onClick={handleClearLogs}>Clear Logs</Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLimit(50)}>50</Button>
          <Button variant="outline" onClick={() => setLimit(100)}>100</Button>
          <Button variant="outline" onClick={() => setLimit(200)}>200</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-l-2 border-t-2 border-r-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Card>
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((log, index) => (
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
        </Card>
      )}
    </div>
  );
};

export default LogsPage;