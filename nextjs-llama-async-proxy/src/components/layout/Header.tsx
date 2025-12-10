'use client';

import React from 'react';
import { useSidebar } from './SidebarProvider';
import { useTheme } from '../ui/ThemeProvider';

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();

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
        onClick={toggleTheme}
        className="p-2 rounded-md hover:bg-primary/80 transition-colors text-primary-foreground"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
};

export default Header;