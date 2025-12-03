import React from 'react';
import { useMetricsStore, useAlertsStore } from '../../store';
import MetricCard from './MetricCard';

const QuickStats = () => {
  const metrics = useMetricsStore((state) => state.metrics);
  const alerts = useAlertsStore((state) => state.alerts);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Quick Stats</h2>
      <div style={styles.grid}>
        <MetricCard
          title="CPU Usage"
          value={Math.round(metrics.cpu?.percent || 0)}
          unit="%"
          icon="🔥"
          color={metrics.cpu?.percent > 80 ? '#ef4444' : '#3b82f6'}
        />
        <MetricCard
          title="Memory Usage"
          value={Math.round(metrics.memory?.percent || 0)}
          unit="%"
          icon="💾"
          color={metrics.memory?.percent > 85 ? '#ef4444' : '#10b981'}
        />
        <MetricCard
          title="Disk Usage"
          value={Math.round(metrics.disk?.percent || 0)}
          unit="%"
          icon="💿"
          color={metrics.disk?.percent > 90 ? '#ef4444' : '#8b5cf6'}
        />
        <MetricCard
          title="GPU Usage"
          value={Math.round(metrics.gpu?.usage || 0)}
          unit="%"
          icon="⚡"
          color={metrics.gpu?.usage > 80 ? '#f59e0b' : '#06b6d4'}
        />
        <MetricCard
          title="Active Alerts"
          value={alerts.length}
          unit="alerts"
          icon="🚨"
          color={alerts.length > 0 ? '#ef4444' : '#10b981'}
        />
        <MetricCard
          title="Network"
          value={(metrics.network?.in + metrics.network?.out || 0).toFixed(1)}
          unit="Mbps"
          icon="🌐"
          color="#06b6d4"
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
  },
  title: {
    marginBottom: '1.5rem',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  },
};

export default QuickStats;
