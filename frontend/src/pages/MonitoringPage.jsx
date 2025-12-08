import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

const MonitoringPage = () => {
  const [metrics, setMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real implementation would connect to API
    const mockMetrics = {
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
    };
    
    setMetrics(mockMetrics);
    setIsLoading(false);
  }, []);

  return (
    <div className="monitoring-page">
      <h1 className="text-2xl font-bold mb-6">Real-time Monitoring</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-l-2 border-t-2 border-r-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default MonitoringPage;