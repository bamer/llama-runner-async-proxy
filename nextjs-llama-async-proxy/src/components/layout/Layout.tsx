'use client';

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { SidebarProvider } from './SidebarProvider';

const Layout = ({ children }: { children: React.ReactNode }) => {
  // Check if we're in a context where theme is available
  let hasThemeProvider = true;
  try {
    // This will throw if ThemeProvider is not available
    React.createContext(undefined);
  } catch {
    hasThemeProvider = false;
  }

  if (!hasThemeProvider) {
    // Fallback layout for pages that don't have ThemeProvider
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <header className="fixed top-0 left-0 right-0 h-16 bg-blue-600 text-white shadow-md z-20 flex items-center px-6">
          <h1 className="text-xl font-bold">Llama Runner Async Proxy</h1>
        </header>
        <main className="flex-1 p-6 pt-20">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background dark:bg-background text-foreground dark:text-foreground">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 pt-20 bg-background dark:bg-background transition-all duration-300">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;