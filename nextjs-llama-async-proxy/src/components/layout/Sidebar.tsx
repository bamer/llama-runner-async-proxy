'use client';

// This is the canonical Sidebar component used throughout the application
// It uses Tailwind CSS classes and Next.js routing for navigation
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarProvider';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const Sidebar = () => {
  const { isOpen } = useSidebar();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈', path: '/monitoring' },
    { id: 'models', label: 'Models', icon: '🤖', path: '/models' },
    { id: 'logs', label: 'Logs', icon: '📋', path: '/logs' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' }
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside className={`fixed top-16 left-0 h-[calc(100vh-60px)] w-64 bg-card border-r border-border shadow-lg z-10 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <nav className="p-4 flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.path}
            className={`flex justify-start items-center p-3 rounded-md hover:bg-muted transition-colors ${isActive(item.path) ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
          >
            <span className="mr-2">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;