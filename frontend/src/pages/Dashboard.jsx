import React, { useState, useEffect } from 'react';
import { useMetricsStore, useModelsStore, useAlertsStore } from '../store';
import QuickStats from '../components/dashboard/QuickStats';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import { wsService } from '../services/websocket';
import { api } from '../services/api';

// Import pages
import MonitoringPage from './Monitoring';
import ModelsPage from './Models';
import ConfigurationPage from './Configuration';
import LogsPage from './Logs';
import SettingsPage from './Settings';

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
        return <QuickStats />;
      case 'monitoring':
        return <MonitoringPage />;
      case 'models':
        return <ModelsPage />;
      case 'config':
        return <ConfigurationPage />;
      case 'logs':
        return <LogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <QuickStats />;
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
  alertItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
    gap: '0.75rem',
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    margin: '0 0 0.25rem 0',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  alertTime: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
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
