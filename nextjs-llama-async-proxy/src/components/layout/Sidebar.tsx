'use client';

// This is the canonical Sidebar component used throughout the application
// It uses Tailwind CSS classes and Next.js routing for navigation
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarProvider';
import { BarChart3, Monitor, Bot, FileText, Settings } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const Sidebar = () => {
  const { isOpen } = useSidebar();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor, path: '/monitoring' },
    { id: 'models', label: 'Models', icon: Bot, path: '/models' },
    { id: 'logs', label: 'Logs', icon: FileText, path: '/logs' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside className={`fixed top-16 left-0 h-[calc(100vh-60px)] w-64 bg-card border-r border-border shadow-lg z-10 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <nav className="p-4 flex flex-col gap-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex justify-start items-center p-3 rounded-md hover:bg-muted transition-colors ${isActive(item.path) ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
            >
              <IconComponent className="mr-2 h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;