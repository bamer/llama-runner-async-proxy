'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../websocket/WebSocketManager';

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
}

const MonitoringPage = () => {
  const { isConnected, lastMessage } = useWebSocket();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState({
    systemMetrics: [
      { name: 'CPU Usage', value: '45%' },
      { name: 'Memory Used', value: '1.2 GB' },
      { name: 'Disk Usage', value: '8.5 GB' },
      { name: 'Network In', value: '2.4 Mbps' },
      { name: 'Network Out', value: '1.7 Mbps' }
    ],
    modelMetrics: [
      { name: 'Active Models', value: '3' },
      { name: 'Model Load Time', value: '2.1s' },
      { name: 'GPU Usage', value: '65%' },
      { name: 'Memory Allocation', value: '7.8 GB' }
    ]
  });

  // Update metrics when WebSocket data arrives
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'metrics' && lastMessage.data) {
      const data = lastMessage.data;
      setMetrics(prev => ({
        systemMetrics: [
          { name: 'CPU Usage', value: `${data.cpuUsage || 45}%` },
          { name: 'Memory Used', value: `${data.memoryUsage || 1.2} GB` },
          { name: 'Disk Usage', value: '8.5 GB' },
          { name: 'Network In', value: '2.4 Mbps' },
          { name: 'Network Out', value: '1.7 Mbps' }
        ],
        modelMetrics: [
          { name: 'Active Models', value: data.activeModels?.toString() || prev.modelMetrics[0]?.value || '3' },
          { name: 'Model Load Time', value: '2.1s' },
          { name: 'GPU Usage', value: `${data.gpuUsage || 65}%` },
          { name: 'Memory Allocation', value: `${data.memoryAllocation || 7.8} GB` }
        ]
      }));
    }
  }, [lastMessage]);

  // Simulate logs streaming
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'logs' && lastMessage.data) {
      setLogs(prev => [...prev, ...lastMessage.data].slice(-50)); // Keep last 50 logs
    }
  }, [lastMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="monitoring-page">
      <h1 className="text-2xl font-bold mb-6">Real-time Monitoring</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">System Metrics</h2>
          <div className="flex flex-col gap-4">
            {metrics.systemMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-muted-foreground">{metric.name}</span>
                <span className="font-mono text-foreground">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Model Performance</h2>
          <div className="flex flex-col gap-4">
            {metrics.modelMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-muted-foreground">{metric.name}</span>
                <span className="font-mono text-foreground">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Connection Status</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Last update: {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString() : 'Never'}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Live Logs</h2>
        <div className="bg-muted rounded p-4 max-h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-muted-foreground">No logs available...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-1 ${getLogLevelColor(log.level)}`}>
                <span className="text-muted-foreground">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;