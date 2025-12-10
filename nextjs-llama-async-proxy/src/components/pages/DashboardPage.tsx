'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from '../websocket/WebSocketManager';

// Simple real-time chart component
const RealtimeChart = ({ data, maxPoints = 20, color = '#3182ce' }: { data: number[], maxPoints?: number, color?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (data.length < 2) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;

    // Find min/max values
    const max = Math.max(...data);
    const min = Math.min(...data);

    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - 2 * padding) * (i / 5);
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }
    ctx.stroke();

    // Draw data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + (width - 2 * padding) * (index / (data.length - 1));
      const y = height - padding - (height - 2 * padding) * ((value - min) / (max - min || 1));

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach((value, index) => {
      const x = padding + (width - 2 * padding) * (index / (data.length - 1));
      const y = height - padding - (height - 2 * padding) * ((value - min) / (max - min || 1));
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

  }, [data, color]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={150}
      className="w-full h-32"
    />
  );
};

// Ensure this is an ES module

const DashboardPage = () => {
  const { isConnected, lastMessage, connectionStatus } = useWebSocket();
  const [metrics, setMetrics] = useState([
    { title: 'Active Models', value: '0', unit: 'Models', icon: '🤖', trend: 0 },
    { title: 'Total Requests', value: '0', unit: 'Requests', icon: '📊', trend: 0 },
    { title: 'Avg Response Time', value: '0ms', unit: 'ms', icon: '⚡', trend: 0 },
    { title: 'Connection Status', value: connectionStatus, unit: '', icon: isConnected ? '🟢' : '🔴', trend: 0 },
  ]);

  // Real-time chart data
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const [requestsHistory, setRequestsHistory] = useState<number[]>([]);

  // Update metrics when WebSocket data arrives
  const updateMetrics = useCallback(() => {
    if (lastMessage && lastMessage.type === 'status' && lastMessage.data) {
      const data = lastMessage.data;

      // Update metrics
      setMetrics([
        { title: 'Active Models', value: data.activeModels?.toString() || '0', unit: 'Models', icon: '🤖', trend: 0 },
        { title: 'Total Requests', value: data.totalRequests?.toString() || '0', unit: 'Requests', icon: '📊', trend: 0 },
        { title: 'Avg Response Time', value: `${data.avgResponseTime || 0}ms`, unit: 'ms', icon: '⚡', trend: 0 },
        { title: 'Connection Status', value: connectionStatus, unit: '', icon: isConnected ? '🟢' : '🔴', trend: 0 },
      ]);

      // Update real-time charts with simulated data
      const cpuUsage = data.cpuUsage || (Math.random() * 100);
      const memoryUsage = data.memoryUsage || (Math.random() * 100);
      const requests = data.totalRequests || Math.floor(Math.random() * 100);

      setCpuHistory(prev => [...prev.slice(-19), cpuUsage]);
      setMemoryHistory(prev => [...prev.slice(-19), memoryUsage]);
      setRequestsHistory(prev => [...prev.slice(-19), requests]);
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

      {/* Real-time Charts */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Real-time Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-foreground">CPU Usage (%)</h3>
            <RealtimeChart data={cpuHistory} color="#3182ce" />
            <div className="mt-2 text-sm text-muted-foreground">
              Current: {cpuHistory[cpuHistory.length - 1]?.toFixed(1) || '0.0'}%
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-foreground">Memory Usage (%)</h3>
            <RealtimeChart data={memoryHistory} color="#38a169" />
            <div className="mt-2 text-sm text-muted-foreground">
              Current: {memoryHistory[memoryHistory.length - 1]?.toFixed(1) || '0.0'}%
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-foreground">Requests/min</h3>
            <RealtimeChart data={requestsHistory} color="#d69e2e" />
            <div className="mt-2 text-sm text-muted-foreground">
              Current: {requestsHistory[requestsHistory.length - 1] || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Recent Activity</h2>
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