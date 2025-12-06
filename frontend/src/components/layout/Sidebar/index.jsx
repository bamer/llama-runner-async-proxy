import React from 'react';

const Sidebar = () => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈' },
    { id: 'models', label: 'Models', icon: '🤖' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <aside className="fixed top-16 left-0 h-[calc(100vh-60px)] w-64 border-r border-border shadow-lg z-10">
      <nav className="p-4 flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className="flex justify-start items-center p-3 rounded-md hover:bg-secondary"
          >
            <span className="mr-2">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;