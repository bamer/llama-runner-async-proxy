import React from 'react';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-md">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🦙 Llama Runner Dashboard</h1>
        <button className="px-4 py-2 border border-border rounded-md hover:bg-secondary">
          Toggle Theme
        </button>
      </div>
    </header>
  );
};

export default Header;