import React, { useState } from 'react';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import MetricCard from '../dashboard/MetricCard';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data for demonstration
  const metricCards = [
    { title: "CPU Usage", value: 65, unit: "%", icon: "🔥", color: "#3b82f6" },
    { title: "Memory Usage", value: 72, unit: "%", icon: "💾", color: "#10b981" },
    { title: "Disk Usage", value: 45, unit: "%", icon: "💿", color: "#8b5cf6" },
    { title: "GPU Usage", value: 32, unit: "%", icon: "⚡", color: "#06b6d4" },
    { title: "Active Alerts", value: 3, unit: "alerts", icon: "🚨", color: "#ef4444" },
    { title: "Network", value: 12.5, unit: "Mbps", icon: "🌐", color: "#06b6d4" },
  ];

  const models = [
    { name: "LLaMA-2-7B", status: "running", port: 8001 },
    { name: "LLaMA-2-13B", status: "stopped", port: 8002 },
    { name: "LLaMA-2-70B", status: "running", port: 8003 },
  ];

  const alerts = [
    { id: 1, message: "Memory usage is high", timestamp: new Date().toISOString() },
    { id: 2, message: "GPU temperature approaching limit", timestamp: new Date().toISOString() },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <Sidebar />
      
      <main className="flex-1 ml-64 mt-16 overflow-auto bg-background">
        <div className="p-8 bg-background min-h-screen">
          <h2 className="text-xl font-bold mb-6">Dashboard</h2>
          
          {/* Quick Stats Section */}
          <div className="bg-secondary border border-border rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="grid grid-cols-auto-fit gap-6">
              {metricCards.map((card, index) => (
                <MetricCard key={index} title={card.title} value={card.value} unit={card.unit} icon={card.icon} color={card.color} />
              ))}
            </div>
          </div>

          {/* Monitoring Section */}
          <div className="bg-secondary border border-border rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">System Monitoring</h3>
            <div className="grid grid-cols-auto-fit gap-6">
              <div className="bg-tertiary border border-border rounded-lg p-6">
                <h4 className="font-semibold mb-4">Active Models ({models.filter(model => model.status === 'running').length})</h4>
                <div className="flex flex-col gap-2">
                  {models.filter(model => model.status === 'running').map((model) => (
                    <div key={model.name} 
                         className="flex justify-between items-center p-3 bg-secondary rounded-md">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-green-500">{model.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-tertiary border border-border rounded-lg p-6">
                <h4 className="font-semibold mb-4">Inactive Models ({models.filter(model => model.status !== 'running').length})</h4>
                <div className="flex flex-col gap-2">
                  {models.filter(model => model.status !== 'running').map((model) => (
                    <div key={model.name} 
                         className="flex justify-between items-center p-3 bg-secondary rounded-md">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-gray-500">{model.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-tertiary border border-border rounded-lg p-6">
                <h4 className="font-semibold mb-4">System Status</h4>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between p-3 bg-secondary rounded-md">
                    <span className="text-secondary">Uptime</span>
                    <span className="font-bold">120 seconds</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-md">
                    <span className="text-secondary">Total Models</span>
                    <span className="font-bold">{models.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-md">
                    <span className="text-secondary">Active Runners</span>
                    <span className="font-bold">2</span>
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
                {alerts.map((alert) => (
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
      </main>
    </div>
  );
};

export default DashboardPage;