'use client';

import React from 'react';
import { useSidebar } from './SidebarProvider';

const Header = () => {
  const { toggleSidebar } = useSidebar();

  // Simple theme toggle that works without context
  const toggleTheme = () => {
    console.log('Theme toggle clicked');
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    console.log('Current theme:', currentTheme, 'New theme:', newTheme);

    // Remove all theme classes first
    html.classList.remove('light', 'dark');
    // Add the new theme class
    html.classList.add(newTheme);

    console.log('HTML classes after toggle:', html.className);

    // Save to localStorage
    localStorage.setItem('llama-theme', newTheme);
  };

  const currentTheme = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground shadow-md z-20 flex items-center justify-between px-6">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-md hover:bg-primary/80 dark:hover:bg-primary/80 transition-colors text-primary-foreground dark:text-primary-foreground"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="text-xl font-bold text-primary-foreground dark:text-primary-foreground">Llama Runner Async Proxy</h1>
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-md hover:bg-primary/80 dark:hover:bg-primary/80 transition-colors text-primary-foreground dark:text-primary-foreground"
        aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        {currentTheme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
};

export default Header;