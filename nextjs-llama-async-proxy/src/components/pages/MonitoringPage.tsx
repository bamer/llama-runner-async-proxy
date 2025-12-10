const MonitoringPage = () => {
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

  return (
    <div className="monitoring-page">
      <h1 className="text-2xl font-bold mb-6">Real-time Monitoring</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">System Metrics</h2>
          <div className="flex flex-col gap-4">
            {mockMetrics.systemMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{metric.name}</span>
                <span className="font-mono">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Model Performance</h2>
          <div className="flex flex-col gap-4">
            {mockMetrics.modelMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{metric.name}</span>
                <span className="font-mono">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;