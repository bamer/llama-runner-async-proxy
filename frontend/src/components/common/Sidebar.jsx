import React from 'react';
import { useUIStore } from '../../store';

const Sidebar = ({ onNavigate }) => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onNavigate) onNavigate(tab);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈' },
    { id: 'models', label: 'Models', icon: '🤖' },
    { id: 'config', label: 'Configuration', icon: '⚙️' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    
  ];

  return (
    <aside style={{ ...styles.sidebar, left: sidebarOpen ? 0 : '-250px' }}>
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            style={{
              ...styles.navItem,
              ...(activeTab === item.id ? styles.navItemActive : {}),
            }}
            onClick={() => handleNavClick(item.id)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

const styles = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: '60px',
    width: '250px',
    height: 'calc(100vh - 60px)',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    padding: '1rem 0',
    overflow: 'auto',
    transition: 'left 0.3s ease',
    zIndex: 100,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    marginLeft: '0.5rem',
    marginRight: '0.5rem',
    borderRadius: '0.5rem',
  },
  navItemActive: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    fontWeight: '600',
  },
  navIcon: {
    fontSize: '1.25rem',
  },
};

export default Sidebar;
