import React from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <div className="app">
      <Header />
      <Sidebar />
      <main className="main-content">
        <DashboardPage />
      </main>
    </div>
  );
}

export default App;