import React from 'react';

const Header = () => {
  return (
    <header className="header fixed top-0 left-0 right-0 z-50 shadow-md bg-secondary border-b border-border">
      <div className="header-content flex justify-between items-center p-4">
        <button className="text-xl cursor-pointer">
          ☰
        </button>
        <h1 className="text-xl font-bold">LLaMA Runner Dashboard</h1>
        
        <div className="flex items-center gap-4">
          <span className="bg-secondary rounded-full px-3 py-1 text-sm">System Status: OK</span>
          <button className="bg-primary rounded-md px-4 py-2 hover:bg-blue-600">
            Connect
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;