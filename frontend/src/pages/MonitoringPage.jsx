import React from 'react';
import { useModelsStore } from '../store';

const MonitoringPage = () => {
  const models = useModelsStore((state) => state.models);
  
  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-xl font-bold mb-6">📊 Real-time Monitoring</h1>
      
      <div className="bg-secondary border border-border rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
          <h2>System Metrics</h2>
          <div className="flex gap-8">
            <div className="text-center">
              <span className="text-sm text-secondary">CPU</span>
              <span className="text-2xl font-bold">0%</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-secondary">Memory</span>
              <span className="text-2xl font-bold">0%</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-secondary">GPU</span>
              <span className="text-2xl font-bold">0%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-auto-fit gap-4 mb-8">
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3>CPU Usage Chart</h3>
            {/* Placeholder for chart */}
            <div className="h-64 bg-tertiary rounded-md mt-4 flex items-center justify-center text-tertiary">Chart placeholder</div>
          </div>
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3>Memory Usage Chart</h3>
            {/* Placeholder for chart */}
            <div className="h-64 bg-tertiary rounded-md mt-4 flex items-center justify-center text-tertiary">Chart placeholder</div>
          </div>
        </div>
      </div>

      <div className="bg-secondary border border-border rounded-lg p-6 mb-8">
        <h2>GPU Metrics</h2>
        <div className="grid grid-cols-auto-fit gap-4 mb-8">
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3>GPU Utilization</h3>
            <div className="text-center mt-4">
              <span className="text-2xl font-bold">0%</span>
            </div>
          </div>
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3>Temperature</h3>
            <div className="text-center mt-4">
              <span className="text-2xl font-bold">0°C</span>
            </div>
          </div>
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3>Memory Usage</h3>
            <div className="text-center mt-4">
              <span className="text-2xl font-bold">0GB / 0GB</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-auto-fit gap-4 mb-8">
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3>GPU Utilization Chart</h3>
            {/* Placeholder for chart */}
            <div className="h-64 bg-tertiary rounded-md mt-4 flex items-center justify-center text-tertiary">Chart placeholder</div>
          </div>
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3>GPU Memory Chart</h3>
            {/* Placeholder for chart */}
            <div className="h-64 bg-tertiary rounded-md mt-4 flex items-center justify-center text-tertiary">Chart placeholder</div>
          </div>
        </div>
      </div>

      <div className="bg-secondary border border-border rounded-lg p-6 mb-8">
        <h2>Active Models ({models.filter(m => m.status === 'running').length})</h2>
        <div className="grid grid-cols-auto-fit gap-4">
          {models.filter(m => m.status === 'running').map((model) => (
            <div key={model.name} className="bg-secondary border border-border rounded-lg p-4">
              <h3>{model.name}</h3>
              <div className="mt-4">
                <p>Token: 0</p>
                <p>Context: 0 / 0</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-secondary border border-border rounded-lg p-6">
        <h2>Model Metrics</h2>
        <div className="grid grid-cols-auto-fit gap-4 mb-8">
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3>Token Speed Chart</h3>
            {/* Placeholder for chart */}
            <div className="h-64 bg-tertiary rounded-md mt-4 flex items-center justify-center text-tertiary">Chart placeholder</div>
          </div>
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3>Context Usage Chart</h3>
            {/* Placeholder for chart */}
            <div className="h-64 bg-tertiary rounded-md mt-4 flex items-center justify-center text-tertiary">Chart placeholder</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;