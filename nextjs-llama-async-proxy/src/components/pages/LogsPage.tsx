'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../websocket/WebSocketManager';

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  source: string;
}

const LogsPage = () => {
  const { lastMessage } = useWebSocket();
  const [logs, setLogs] = useState<LogEntry[]>([
    { level: 'info', message: 'Model loading started for llama-2-7b-chat', timestamp: '2025-01-01T10:00:00Z', source: 'model-manager' },
    { level: 'debug', message: 'GPU memory allocation completed', timestamp: '2025-01-01T10:00:00Z', source: 'gpu-manager' },
    { level: 'warn', message: 'Memory usage approaching 80%', timestamp: '2025-01-01T10:01:00Z', source: 'system-monitor' },
    { level: 'error', message: 'Failed to load model llama-3-8b', timestamp: '2025-01-01T10:02:00Z', source: 'model-manager' },
    { level: 'info', message: 'New log entry added', timestamp: '2025-01-01T10:03:00Z', source: 'log-manager' }
  ]);
  const [filterText, setFilterText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [maxLines, setMaxLines] = useState(50);

  // Update logs when WebSocket data arrives
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'logs' && lastMessage.data) {
      const newLogs = lastMessage.data.map((log: { level: string; message: string; timestamp: number }) => ({
        level: log.level,
        message: log.message,
        timestamp: new Date(log.timestamp).toISOString(),
        source: 'websocket'
      }));
      setLogs(prev => [...prev, ...newLogs].slice(-maxLines));
    }
  }, [lastMessage, maxLines]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredLogs = logs.filter(log => {
    const matchesText = log.message.toLowerCase().includes(filterText.toLowerCase()) ||
                       log.source.toLowerCase().includes(filterText.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesText && matchesLevel;
  });

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'warn': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'info': return 'bg-blue-500/10 border-blue-500/20';
      case 'debug': return 'bg-gray-500/10 border-gray-500/20';
      default: return 'bg-muted border-border';
    }
  };

  const getLogLevelTextColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="logs-page">
      <h1 className="text-2xl font-bold mb-6">Logs</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Filter logs..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="border border-border rounded-md px-4 py-2 bg-background text-foreground"
          />
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="border border-border rounded-md px-4 py-2 bg-background text-foreground"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          <button
            onClick={clearLogs}
            className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground"
          >
            Clear Logs
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMaxLines(50)}
            className={`px-4 py-2 rounded-md transition-colors ${maxLines === 50 ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted text-foreground'}`}
          >
            50
          </button>
          <button
            onClick={() => setMaxLines(100)}
            className={`px-4 py-2 rounded-md transition-colors ${maxLines === 100 ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted text-foreground'}`}
          >
            100
          </button>
          <button
            onClick={() => setMaxLines(200)}
            className={`px-4 py-2 rounded-md transition-colors ${maxLines === 200 ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted text-foreground'}`}
          >
            200
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {filteredLogs.map((log, index) => (
            <div key={index} className={`p-2 border rounded-md ${getLogLevelColor(log.level)}`}>
              <div className="flex justify-between">
                <span className={`font-mono ${getLogLevelTextColor(log.level)}`}>
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