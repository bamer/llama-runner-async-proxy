'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSidebar } from './SidebarProvider';

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const [theme, setTheme] = useState('light');
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      // Get theme from localStorage on mount
      const savedTheme = localStorage.getItem('theme') || 'light';
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      initializedRef.current = true;
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }; // eslint-disable-next-line react-hooks/exhaustive-deps

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary text-primary-foreground shadow-md z-20 flex items-center justify-between px-6">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-md hover:bg-primary/80 transition-colors text-primary-foreground"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="text-xl font-bold text-primary-foreground">Llama Runner Async Proxy</h1>
      </div>

      <button
        onClick={handleThemeToggle}
        className="p-2 rounded-md hover:bg-primary/80 transition-colors text-primary-foreground"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
};

export default Header;