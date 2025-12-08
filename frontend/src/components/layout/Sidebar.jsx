import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SidebarNavigation = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/models', label: 'Models', icon: '🚀' },
    { path: '/logs', label: 'Logs', icon: '📝' },
    { path: '/monitoring', label: 'Monitoring', icon: '📊' },
    { path: '/config', label: 'Configuration', icon: '⚙️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <aside className="sidebar fixed top-0 left-0 bottom-0 w-64 bg-secondary border-r border-border z-10">
      <div className="sidebar-header p-4 border-b border-border">
        <h2 className="text-xl font-bold">LLaMA Runner</h2>
      </div>
      
      <nav className="sidebar-nav p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link 
                to={item.path} 
                className={`flex items-center gap-3 p-2 rounded-md hover:bg-secondary ${location.pathname === item.path ? 'bg-primary text-white' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default SidebarNavigation;