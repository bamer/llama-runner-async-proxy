'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../websocket/WebSocketManager';

// Ensure this is an ES module

const DashboardPage = () => {
  const { isConnected, lastMessage, connectionStatus } = useWebSocket();
  const [metrics, setMetrics] = useState([
    { title: 'CPU Usage', value: '45%', unit: 'Percent', icon: '💻', trend: 3 },
    { title: 'Memory Usage', value: '1.2 GB', unit: 'GB', icon: '🧠', trend: -2 },
    { title: 'Disk Usage', value: '8.5 GB', unit: 'GB', icon: '💾', trend: 1 },
    { title: 'Network', value: '2.4 Mbps', unit: 'Mbps', icon: '🌐', trend: 0 },
  ]);

  // Update metrics when WebSocket data arrives
  const updateMetrics = useCallback(() => {
    if (lastMessage && lastMessage.type === 'status' && lastMessage.data) {
      const data = lastMessage.data;
      setMetrics([
        { title: 'Active Models', value: data.activeModels?.toString() || '0', unit: 'Models', icon: '🤖', trend: 0 },
        { title: 'Total Requests', value: data.totalRequests?.toString() || '0', unit: 'Requests', icon: '📊', trend: 0 },
        { title: 'Avg Response Time', value: `${data.avgResponseTime || 0}ms`, unit: 'ms', icon: '⚡', trend: 0 },
        { title: 'Connection Status', value: connectionStatus, unit: '', icon: isConnected ? '🟢' : '🔴', trend: 0 },
      ]);
    }
  }, [lastMessage, connectionStatus, isConnected]);

  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  return (
    <div className="dashboard-page">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-card border border-border rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{metric.title}</h3>
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <div className="mb-4">
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-sm opacity-50">{metric.unit}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${metric.trend > 0 ? 'text-green-500' : metric.trend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {metric.trend > 0 ? '+' : ''}{metric.trend}
              </span>
              <span className="text-xs opacity-75">Trend</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <span className="text-foreground">Real-time Activity Feed</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            {lastMessage ? `Last update: ${new Date(lastMessage.timestamp).toLocaleTimeString()}` : 'Waiting for data...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;