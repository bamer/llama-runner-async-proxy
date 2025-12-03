import React, { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { useThemeStore } from './store';
import './styles/global.css';

function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <Dashboard />;
}

export default App;
