import React, { useState, useEffect } from 'react';
import { useMetricsStore, useModelsStore, useAlertsStore } from '../store';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { wsService } from '../services/websocket';
import { api } from '../services/api';

// Import pages
import ModelsPage from './Models';
import ConfigurationPage from './Configuration';
import LogsPage from './Logs';
import MonitoringPage from './Monitoring';

const DashboardPage = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const alerts = useAlertsStore((state) => state.alerts);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Connect WebSocket
        await wsService.connect();
        setIsConnected(true);

        // Load initial data
        const [metricsRes, modelsRes] = await Promise.all([
          api.getMetrics(),
          api.getModels(),
        ]);

        useMetricsStore.getState().updateMetrics(metricsRes.data);
        useModelsStore.getState().updateModels(modelsRes.data.models || []);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Retry in 5 seconds
        setTimeout(initializeApp, 5000);
      }
    };

    initializeApp();

    return () => {
      wsService.disconnect();
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent />;
      case 'models':
        return <ModelsPage />;
      case 'config':
        return <ConfigurationPage />;
      case 'logs':
        return <LogsPage />;
      case 'monitoring':
        return <MonitoringPage />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <Sidebar />
      <main className="flex-1 ml-64 mt-16 overflow-auto bg-background">
        {!isConnected && (
          <div className="p-4 bg-warning text-white text-center font-bold z-50">
            ⚠️ Connecting to server...
          </div>
        )}
        {renderPage()}
      </main>
      {alerts.length > 0 && <AlertsPanel />}
    </div>
  );
};

const DashboardContent = () => {
  const metrics = useMetricsStore((state) => state.metrics);
  const models = useModelsStore((state) => state.models);
  const alerts = useAlertsStore((state) => state.alerts);

  // Metrics cards data
  const metricCards = [
    { title: "CPU Usage", value: Math.round(metrics.cpu?.percent || 0), unit: "%", icon: "🔥", color: metrics.cpu?.percent > 80 ? '#ef4444' : '#3b82f6' },
    { title: "Memory Usage", value: Math.round(metrics.memory?.percent || 0), unit: "%", icon: "💾", color: metrics.memory?.percent > 85 ? '#ef4444' : '#10b981' },
    { title: "Disk Usage", value: Math.round(metrics.disk?.percent || 0), unit: "%", icon: "💿", color: metrics.disk?.percent > 90 ? '#ef4444' : '#8b5cf6' },
    { title: "GPU Usage", value: Math.round(metrics.gpu?.usage || 0), unit: "%", icon: "⚡", color: metrics.gpu?.usage > 80 ? '#f59e0b' : '#06b6d4' },
    { title: "Active Alerts", value: alerts.length, unit: "alerts", icon: "🚨", color: alerts.length > 0 ? '#ef4444' : '#10b981' },
    { title: "Network", value: (metrics.network?.in + metrics.network?.out || 0).toFixed(1), unit: "Mbps", icon: "🌐", color: "#06b6d4" },
  ];

  // Models data
  const activeModels = models.filter(model => model.status === 'running');
  const inactiveModels = models.filter(model => model.status !== 'running');

  return (
    <div className="p-8 bg-background min-h-screen">
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      
      {/* Quick Stats Section */}
      <div className="bg-secondary border border-border rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
        <div className="grid grid-cols-auto-fit gap-6">
          {metricCards.map((card, index) => (
            <div key={index} 
                 className="bg-tertiary border border-border rounded-lg p-5 text-white"
                 style={{ backgroundColor: card.color }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{card.icon}</span>
                <h4 className="font-semibold">{card.title}</h4>
              </div>
              <div className="flex flex-col items-center mt-2">
                <span className="text-2xl font-bold">{card.value}</span>
                <span className="opacity-75">{card.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoring Section */}
      <div className="bg-secondary border border-border rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">System Monitoring</h3>
        <div className="grid grid-cols-auto-fit gap-6">
          <div className="bg-tertiary border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Active Models ({activeModels.length})</h4>
            {activeModels.length > 0 ? (
              <div className="flex flex-col gap-2">
                {activeModels.map((model) => (
                  <div key={model.name} 
                       className="flex justify-between items-center p-3 bg-secondary rounded-md">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-green-500">{model.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-tertiary italic">No active models</p>
            )}
          </div>

          <div className="bg-tertiary border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Inactive Models ({inactiveModels.length})</h4>
            {inactiveModels.length > 0 ? (
              <div className="flex flex-col gap-2">
                {inactiveModels.map((model) => (
                  <div key={model.name} 
                       className="flex justify-between items-center p-3 bg-secondary rounded-md">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-gray-500">{model.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-tertiary italic">No inactive models</p>
            )}
          </div>

          <div className="bg-tertiary border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">System Status</h4>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between p-3 bg-secondary rounded-md">
                <span className="text-secondary">Uptime</span>
                <span className="font-bold">{metrics.uptime || 'N/A'} seconds</span>
              </div>
              <div className="flex justify-between p-3 bg-secondary rounded-md">
                <span className="text-secondary">Total Models</span>
                <span className="font-bold">{models.length}</span>
              </div>
              <div className="flex justify-between p-3 bg-secondary rounded-md">
                <span className="text-secondary">Active Runners</span>
                <span className="font-bold">{metrics.active_runners || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-secondary border border-border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
          <div className="flex flex-col gap-2">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} 
                   className="p-3 bg-secondary border border-border rounded-md">
                <div className="flex flex-col">
                  <p className="font-medium">{alert.message}</p>
                  <span className="text-sm text-tertiary">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AlertsPanel = () => {
  const alerts = useAlertsStore((state) => state.alerts);
  const dismissAlert = useAlertsStore((state) => state.dismissAlert);

  return (
    <div className="fixed bottom-5 right-5 w-80 max-h-[400px] bg-secondary border border-border rounded-lg shadow-lg z-50">
      <div className="p-4 border-b border-border">
        <h3 className="text-xl font-bold">🚨 Alerts ({alerts.length})</h3>
      </div>
      <div className="max-h-[350px] overflow-auto p-4">
        {alerts.map((alert) => (
          <div key={alert.id} 
               className="p-4 bg-secondary border border-border rounded-md mb-2 flex justify-between">
            <div className="flex flex-col">
              <p className="font-medium">{alert.message}</p>
              <span className="text-sm text-tertiary">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 text-tertiary hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;