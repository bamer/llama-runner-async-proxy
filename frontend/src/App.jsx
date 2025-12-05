import React, { useState } from 'react';
import Sidebar from './components/common/Sidebar';
import DashboardAndMonitoring from './pages/DashboardAndMonitoring';
import Monitoring from './pages/Monitoring';
import ModelsPage from './pages/ModelsPage';
import Configuration from './pages/Configuration';
import Logs from './pages/Logs';
import SettingsPage from './pages/SettingsPage';
import { useUIStore } from './store';

function App() {
  const activeTab = useUIStore((state) => state.activeTab);
  
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <DashboardAndMonitoring />;
      case 'monitoring':
        return <Monitoring />;
      case 'models':
        return <ModelsPage />;
      case 'config':
        return <Configuration />;
      case 'logs':
        return <Logs />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardAndMonitoring />;
    }
  };

  return (
    <div className="App">
      <Sidebar />
      <main style={{ 
        marginLeft: '250px',
        marginTop: '60px',
        minHeight: 'calc(100vh - 60px)',
        transition: 'margin-left 0.3s ease'
      }}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;