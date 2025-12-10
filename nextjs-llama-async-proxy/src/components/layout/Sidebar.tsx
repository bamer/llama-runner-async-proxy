'use client';

// This is the canonical Sidebar component used throughout the application
// It uses Tailwind CSS classes and React hooks for state management
import React, { useState } from 'react';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
  };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈' },
    { id: 'models', label: 'Models', icon: '🤖' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <aside className={`fixed top-16 left-0 h-[calc(100vh-60px)] w-64 border-r border-border shadow-lg z-10 transition-all duration-300`} style={{left: sidebarOpen ? '0' : '-250px'}}>
      <nav className="p-4 flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`flex justify-start items-center p-3 rounded-md hover:bg-secondary ${activeTab === item.id ? 'bg-primary text-white' : ''}`}
            onClick={() => handleNavClick(item.id)}
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