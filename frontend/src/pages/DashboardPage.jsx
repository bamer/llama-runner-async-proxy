import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/dashboard/MetricCard';

const DashboardPage = () => {
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration - in real implementation would connect to API
    const mockMetrics = [
      { title: 'CPU Usage', value: '45%', unit: 'Percent', icon: '💻', trend: 3 },
      { title: 'Memory Usage', value: '1.2 GB', unit: 'GB', icon: '🧠', trend: -2 },
      { title: 'Disk Usage', value: '8.5 GB', unit: 'GB', icon: '💾', trend: 1 },
      { title: 'Network', value: '2.4 Mbps', unit: 'Mbps', icon: '🌐', trend: 0 },
    ];

    setMetrics(mockMetrics);
    setIsLoading(false);
  }, []);

  return (
    <div className="dashboard-page">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-l-2 border-t-2 border-r-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              unit={metric.unit}
              icon={metric.icon}
              trend={metric.trend}
            />
          ))}
        </div>
      )}
      
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
};

export default DashboardPage;