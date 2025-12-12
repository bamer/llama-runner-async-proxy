'use client';

import React from 'react';
import { useSidebar } from './SidebarProvider';
// No theme-related imports
// No theme-related imports
// No theme-related imports
// No theme-related imports
// No theme-related imports
// No theme-related imports
// No theme-related imports


const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-blue-500 text-white shadow-md z-20 flex items-center justify-between px-6">
       <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-md hover:bg-blue-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="text-xl font-bold text-white">Llama Runner Async Proxy</h1>
      </div>

       
    </header>
  );
};

export default Header;