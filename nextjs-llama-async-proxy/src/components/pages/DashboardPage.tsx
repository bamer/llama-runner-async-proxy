import React from 'react';

const DashboardPage = () => {
  const mockMetrics = [
    { title: 'CPU Usage', value: '45%', unit: 'Percent', icon: '💻', trend: 3 },
    { title: 'Memory Usage', value: '1.2 GB', unit: 'GB', icon: '🧠', trend: -2 },
    { title: 'Disk Usage', value: '8.5 GB', unit: 'GB', icon: '💾', trend: 1 },
    { title: 'Network', value: '2.4 Mbps', unit: 'Mbps', icon: '🌐', trend: 0 },
  ];

  return (
    <div className="dashboard-page">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
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
        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <span>Model loading notifications</span>
            <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">View All</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;