import React, { useState, useEffect } from 'react';
import { useMetricsStore, useModelsStore, useAlertsStore } from '../store';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import { wsService } from '../services/websocket';
import { api } from '../services/api';

// Import pages
import ModelsPage from './Models';
import ConfigurationPage from './Configuration';
import LogsPage from './Logs';

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
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div style={styles.app}>
      <Header />
      <Sidebar onNavigate={setCurrentPage} />
      <main style={styles.main}>
        {!isConnected && (
          <div style={styles.connectionStatus}>
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
    <div style={styles.container}>
      <h2 style={styles.title}>Dashboard</h2>
      
      {/* Quick Stats Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Quick Stats</h3>
        <div style={styles.grid}>
          {metricCards.map((card, index) => (
            <div key={index} style={{ ...styles.metricCard, backgroundColor: card.color }}>
              <div style={styles.metricHeader}>
                <span style={styles.metricIcon}>{card.icon}</span>
                <h4 style={styles.metricTitle}>{card.title}</h4>
              </div>
              <div style={styles.metricValue}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{card.value}</span>
                <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>{card.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoring Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>System Monitoring</h3>
        <div style={styles.monitoringGrid}>
          <div style={styles.monitoringCard}>
            <h4 style={styles.cardTitle}>Active Models ({activeModels.length})</h4>
            {activeModels.length > 0 ? (
              <div style={styles.modelsList}>
                {activeModels.map((model) => (
                  <div key={model.name} style={styles.modelItem}>
                    <span style={styles.modelName}>{model.name}</span>
                    <span style={{ color: '#4caf50' }}>{model.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.noModels}>No active models</p>
            )}
          </div>

          <div style={styles.monitoringCard}>
            <h4 style={styles.cardTitle}>Inactive Models ({inactiveModels.length})</h4>
            {inactiveModels.length > 0 ? (
              <div style={styles.modelsList}>
                {inactiveModels.map((model) => (
                  <div key={model.name} style={styles.modelItem}>
                    <span style={styles.modelName}>{model.name}</span>
                    <span style={{ color: '#999' }}>{model.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.noModels}>No inactive models</p>
            )}
          </div>

          <div style={styles.monitoringCard}>
            <h4 style={styles.cardTitle}>System Status</h4>
            <div style={styles.statusGrid}>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Uptime</span>
                <span style={styles.statusText}>{metrics.uptime || 'N/A'} seconds</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Total Models</span>
                <span style={styles.statusText}>{models.length}</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Active Runners</span>
                <span style={styles.statusText}>{metrics.active_runners || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Recent Alerts</h3>
          <div style={styles.alertsList}>
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} style={styles.alertItem}>
                <div style={styles.alertContent}>
                  <p style={styles.alertMessage}>{alert.message}</p>
                  <span style={styles.alertTime}>
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
    <div style={styles.alertsPanel}>
      <div style={styles.alertsHeader}>
        <h3>🚨 Alerts ({alerts.length})</h3>
      </div>
      <div style={styles.alertsList}>
        {alerts.map((alert) => (
          <div key={alert.id} style={styles.alertItem}>
            <div style={styles.alertContent}>
              <p style={styles.alertMessage}>{alert.message}</p>
              <span style={styles.alertTime}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              style={styles.dismissBtn}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  main: {
    flex: 1,
    marginLeft: '250px',
    marginTop: '60px',
    overflow: 'auto',
    backgroundColor: 'var(--bg-primary)',
  },
  connectionStatus: {
    padding: '1rem',
    backgroundColor: 'var(--color-warning)',
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    zIndex: 50,
  },
  container: { padding: '2rem', backgroundColor: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' },
  title: { color: 'var(--text-primary)', marginBottom: '1.5rem' },
  section: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' },
  metricCard: { 
    backgroundColor: 'var(--bg-tertiary)', 
    border: '1px solid var(--border-color)', 
    borderRadius: '0.75rem', 
    padding: '1.25rem',
    color: 'white'
  },
  metricHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  metricIcon: { fontSize: '1.5rem' },
  metricTitle: { fontSize: '1rem', fontWeight: '600', margin: '0' },
  metricValue: { 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '0.75rem'
  },
  monitoringGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' },
  monitoringCard: { 
    backgroundColor: 'var(--bg-tertiary)', 
    border: '1px solid var(--border-color)', 
    borderRadius: '0.75rem', 
    padding: '1.5rem'
  },
  cardTitle: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' },
  modelsList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  modelItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' },
  modelName: { fontWeight: '500' },
  statusGrid: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  statusItem: { 
    display: 'flex', 
    justifyContent: 'space-between',
    padding: '0.75rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '4px'
  },
  statusLabel: { color: 'var(--text-secondary)' },
  statusText: { fontWeight: '600' },
  noModels: { color: 'var(--text-tertiary)', fontStyle: 'italic' },
  alertsList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  alertItem: { 
    padding: '0.75rem', 
    backgroundColor: 'var(--bg-secondary)', 
    borderRadius: '4px',
    border: '1px solid var(--border-color)'
  },
  alertContent: { display: 'flex', flexDirection: 'column' },
  alertMessage: { margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '500' },
  alertTime: { fontSize: '0.75rem', color: 'var(--text-tertiary)' },
  alertsPanel: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '350px',
    maxHeight: '400px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 1000,
  },
  alertsHeader: {
    padding: '1rem',
    borderBottom: '1px solid var(--border-color)',
  },
  alertsList: {
    maxHeight: '350px',
    overflow: 'auto',
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '0',
    fontSize: '1rem',
  },
};

export default DashboardPage;
