import React from 'react';

const Sidebar = ({ activeTab, onNavigate, sidebarOpen, onToggleSidebar }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'models', label: 'Models', icon: '🤖' },
    { id: 'config', label: 'Configuration', icon: '⚙️' },
    { id: 'logs', label: 'Logs', icon: '📋' }
  ];

  const overviewSubItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'metrics', label: 'System Metrics', icon: '📈' },
    { id: 'models', label: 'Active Models', icon: '⚡' }
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>Llama Runner</h2>
        <button 
          className="toggle-btn" 
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
            
            {activeTab === 'overview' && (
              <div className="sub-menu">
                {overviewSubItems.map((subItem) => (
                  <button
                    key={subItem.id}
                    className={`sub-nav-item ${activeTab === subItem.id ? 'active' : ''}`}
                    onClick={() => onNavigate(subItem.id)}
                  >
                    <span className="sub-nav-icon">{subItem.icon}</span>
                    <span className="sub-nav-label">{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;