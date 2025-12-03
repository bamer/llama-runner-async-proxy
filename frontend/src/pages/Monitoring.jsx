import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { useMetricsStore } from '../store';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const MonitoringPage = () => {
  const metricsHistory = useMetricsStore((state) => state.metricsHistory);
  const [cpuChartData, setCpuChartData] = useState(null);
  const [memoryChartData, setMemoryChartData] = useState(null);
  const [networkChartData, setNetworkChartData] = useState(null);

  useEffect(() => {
    if (metricsHistory && metricsHistory.length > 0) {
      const labels = metricsHistory.map((m, i) =>
        new Date(m.timestamp).toLocaleTimeString().split(' ')[0]
      );

      // CPU Chart
      setCpuChartData({
        labels,
        datasets: [
          {
            label: 'CPU Usage %',
            data: metricsHistory.map((m) => m.cpu?.percent || 0),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      });

      // Memory Chart
      setMemoryChartData({
        labels,
        datasets: [
          {
            label: 'Memory Used (GB)',
            data: metricsHistory.map((m) => m.memory?.used || 0),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      });

      // Network Chart
      setNetworkChartData({
        labels,
        datasets: [
          {
            label: 'Incoming (MB)',
            data: metricsHistory.map((m) => m.network?.in || 0),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            type: 'line',
          },
          {
            label: 'Outgoing (MB)',
            data: metricsHistory.map((m) => m.network?.out || 0),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            type: 'line',
          },
        ],
      });
    }
  }, [metricsHistory]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📈 Real-time Monitoring</h2>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3>CPU Usage</h3>
          {cpuChartData && <Line data={cpuChartData} options={chartOptions} />}
        </div>

        <div style={styles.chartCard}>
          <h3>Memory Usage</h3>
          {memoryChartData && (
            <Line data={memoryChartData} options={chartOptions} />
          )}
        </div>

        <div style={styles.chartCard}>
          <h3>Network Traffic</h3>
          {networkChartData && (
            <Line data={networkChartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
  },
  title: {
    marginBottom: '2rem',
    fontSize: '1.75rem',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '2rem',
  },
  chartCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: 'var(--shadow)',
  },
};

export default MonitoringPage;
