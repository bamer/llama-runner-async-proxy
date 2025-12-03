import React, { useState } from 'react';
import { useThemeStore, useUIStore } from '../../store';

const Header = () => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <button onClick={toggleSidebar} style={styles.menuBtn}>
          ☰
        </button>
        <h1 style={styles.title}>🦙 Llama Runner Dashboard</h1>
      </div>
      <div style={styles.headerRight}>
        <button onClick={toggleTheme} style={styles.themeBtn}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  headerRight: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    padding: '0.25rem 0.5rem',
  },
  themeBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
  },
};

export default Header;
