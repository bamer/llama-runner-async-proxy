import React from 'react';
import { useThemeStore, useUIStore } from '../store';

const SettingsPage = () => {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>⚡ Settings</h2>

      <div style={styles.settingsCard}>
        <h3>Appearance</h3>
        <div style={styles.setting}>
          <label>Theme:</label>
          <div style={styles.buttonGroup}>
            <button
              onClick={() => setTheme('light')}
              style={{
                ...styles.themeBtn,
                ...(theme === 'light' ? styles.themeBtnActive : {}),
              }}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              style={{
                ...styles.themeBtn,
                ...(theme === 'dark' ? styles.themeBtnActive : {}),
              }}
            >
              🌙 Dark
            </button>
          </div>
        </div>
      </div>

      <div style={styles.settingsCard}>
        <h3>User Interface</h3>
        <div style={styles.setting}>
          <label>
            <input
              type="checkbox"
              checked={sidebarOpen}
              onChange={toggleSidebar}
            />
            Show Sidebar
          </label>
        </div>
      </div>

      <div style={styles.settingsCard}>
        <h3>About</h3>
        <div style={styles.infoItem}>
          <strong>Application:</strong> Llama Runner Dashboard
        </div>
        <div style={styles.infoItem}>
          <strong>Version:</strong> 1.0.0
        </div>
        <div style={styles.infoItem}>
          <strong>Status:</strong> <span style={{ color: '#10b981' }}>✓ Online</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '600px',
  },
  title: {
    marginBottom: '2rem',
  },
  settingsCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  setting: {
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  themeBtn: {
    padding: '0.5rem 1rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  themeBtnActive: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderColor: 'var(--color-primary)',
  },
  infoItem: {
    padding: '0.75rem 0',
    borderBottom: '1px solid var(--border-color)',
  },
};

export default SettingsPage;
