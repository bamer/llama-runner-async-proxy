'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from './SidebarProvider';

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const [theme, setTheme] = useState('light');

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('llama-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(savedTheme);
  }, []);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('llama-theme', newTheme);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-blue-600 text-white shadow-md z-20 flex items-center justify-between px-6">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-md hover:bg-blue-700 transition-colors text-white"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="text-xl font-bold text-white">Llama Runner Async Proxy</h1>
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-md hover:bg-blue-700 transition-colors text-white"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
};

export default Header;