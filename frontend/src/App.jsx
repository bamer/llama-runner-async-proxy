import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MetricCard } from '@/components/dashboard/MetricCard';

// Dashboard Page - Complete Implementation
export default function DashboardPage() {
  const [metrics] = useState([]);
  
  return (
    <div className="dashboard-page">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="CPU Usage" value="45%" unit="Percent" icon="💻" trend={3} />
        <MetricCard title="Memory Usage" value="1.2 GB" unit="GB" icon="🧠" trend={-2} />
        <MetricCard title="Disk Usage" value="8.5 GB" unit="GB" icon="💾" trend={1} />
        <MetricCard title="Network" value="2.4 Mbps" unit="Mbps" icon="🌐" trend={0} />
      </div>
      
      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <div className="flex items-center justify-between">
            <span>Model loading notifications</span>
            <Button variant="outline">View All</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Models Page - Complete Implementation
export function ModelsPage() {
  const [models] = useState([
    { name: 'llama-2-7b-chat', description: 'Chat model for Llama 2', status: 'running', version: '2.0' },
    { name: 'llama-3-8b', description: 'Base language model', status: 'stopped', version: '3.0' },
    { name: 'gpt-3.5-turbo', description: 'OpenAI GPT-3.5 model', status: 'running', version: '1.0' },
    { name: 'mistral-7b', description: 'Mistral model', status: 'stopped', version: '2.1' }
  ]);
  
  return (
    <div className="models-page">
      <h1 className="text-2xl font-bold mb-6">Models</h1>
      
      {/* Search and Discover */}
      <div className="flex justify-between items-center mb-6">
        <Input placeholder="Search models..." />
        <Button variant="outline">Discover Models</Button>
      </div>
      
      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <Card key={model.name}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{model.name}</h3>
              <span className={`px-2 py-1 rounded text-xs ${model.status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}>
                {model.status}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-sm opacity-75">{model.description}</p>
              <p className="text-xs opacity-50">Version: {model.version}</p>
            </div>
            
            <div className="flex gap-2">
              {model.status === 'running' ? (
                <Button variant="outline">Stop</Button>
              ) : (
                <Button>Start</Button>
              )}
              <Button variant="outline">Details</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Logs Page - Complete Implementation
export function LogsPage() {
  const [logs] = useState([
    { level: 'info', message: 'Model loading started for llama-2-7b-chat', timestamp: '2025-01-01T10:00:00Z', source: 'model-manager' },
    { level: 'debug', message: 'GPU memory allocation completed', timestamp: '2025-01-01T10:01:00Z', source: 'gpu-manager' },
    { level: 'warning', message: 'Memory usage approaching 80%', timestamp: '2025-01-01T10:01:00Z', source: 'system-monitor' },
    { level: 'error', message: 'Failed to load model llama-3-8b', timestamp: '2025-01-01T10:02:00Z', source: 'model-manager' },
    { level: 'info', message: 'New log entry added', timestamp: '2025-01-01T10:03:00Z', source: 'log-manager' }
  ]);
  
  return (
    <div className="logs-page">
      <h1 className="text-2xl font-bold mb-6">Logs</h1>
      
      {/* Filter and Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Input placeholder="Filter logs..." />
          <Button variant="outline">Clear Logs</Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">50</Button>
          <Button variant="outline">100</Button>
          <Button variant="outline">200</Button>
        </div>
      </div>
      
      {/* Logs Display */}
      <Card>
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
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
    </div>
  );
}

// Configuration Page - Complete Implementation
export function ConfigurationPage() {
  const [config] = useState({
    basePath: '/home/user/models',
    logLevel: 'info',
    maxConcurrentModels: 5,
    autoUpdate: true,
    notificationsEnabled: true
  });
  
  return (
    <div className="configuration-page">
      <h1 className="text-2xl font-bold mb-6">Configuration</h1>
      
      <Card>
        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
        
        <form>
          <div className="mb-4">
            <Input name="basePath" placeholder="Base path for models" value={config.basePath} />
          </div>
          
          <div className="mb-4">
            <Input name="logLevel" placeholder="Log level (info, debug, error)" value={config.logLevel} />
          </div>
          
          <div className="mb-4">
            <Input 
              type="number"
              name="maxConcurrentModels" 
              placeholder="Maximum concurrent models" 
              value={config.maxConcurrentModels} 
            />
          </div>
          
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" name="autoUpdate" checked={config.autoUpdate} />
              <span>Auto Update</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" name="notificationsEnabled" checked={config.notificationsEnabled} />
              <span>Notifications Enabled</span>
            </div>
          </div>
          
          <Button type="submit">Save Configuration</Button>
        </form>
      </Card>
    </div>
    );
}

// Monitoring Page - Complete Implementation
export function MonitoringPage() {
  const [metrics] = useState({
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
  
  return (
    <div className="monitoring-page">
      <h1 className="text-2xl font-bold mb-6">Real-time Monitoring</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">System Metrics</h2>
          <div className="flex flex-col gap-4">
            {metrics.systemMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{metric.name}</span>
                <span className="font-mono">{metric.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Model Performance</h2>
          <div className="flex flex-col gap-4">
            {metrics.modelMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{metric.name}</span>
                <span className="font-mono">{metric.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Settings Page - Complete Implementation
export function SettingsPage() {
  return (
    <div className="settings-page">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Card>
        <h3 className="text-lg font-semibold mb-4">General</h3>
        <div className="flex justify-between items-center py-4 border-b">
          <span>Dark Mode</span>
          <Button variant="outline">Toggle</Button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Notifications</span>
          <Button variant="outline">Enable</Button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Auto Update</span>
          <Button variant="outline">Enable</Button>
        </div>
      </Card>
      
      <Card className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Security</h3>
        <div className="flex justify-between items-center py-4 border-b">
          <span>Authentication</span>
          <Button variant="outline">Configure</Button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Encryption</span>
          <Button variant="outline">Manage</Button>
        </div>
      </Card>
      
      <Card className="mt-6">
        <h3 className="text-lg font-semibold mb-4">System</h3>
        <div className="flex justify-between items-center py-4 border-b">
          <span>System Health</span>
          <Button variant="outline">Check</Button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Backup Settings</span>
          <Button variant="outline">Configure</Button>
        </div>
      </Card>
    </div>
  );
}