import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 pt-16">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;