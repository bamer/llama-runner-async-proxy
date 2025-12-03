import React, { useEffect, useState } from 'react';
import { useConfigStore } from '../store';
import { api } from '../services/api';
import { wsService } from '../services/websocket';

const ConfigurationPage = () => {
  const [activeTab, setActiveTab] = useState('paths');
  const [config, setConfig] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.getConfig();
      setConfig(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load config:', error);
      setLoading(false);
    }
  };

  const handleConfigChange = (section, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setUnsavedChanges(true);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.updateConfig(config);
      setUnsavedChanges(false);
      wsService.emit('config:updated', { config });
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading configuration...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>⚙️ Configuration</h2>

      <div style={styles.tabs}>
        {['paths', 'proxies', 'monitoring', 'logging'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'paths' && config && (
        <PathsConfig config={config} onChange={handleConfigChange} />
      )}

      {activeTab === 'proxies' && config && (
        <ProxiesConfig config={config} onChange={handleConfigChange} />
      )}

      {activeTab === 'monitoring' && config && (
        <MonitoringConfig config={config} onChange={handleConfigChange} />
      )}

      {activeTab === 'logging' && config && (
        <LoggingConfig config={config} onChange={handleConfigChange} />
      )}

      <div style={styles.footer}>
        <button
          onClick={loadConfig}
          style={{ ...styles.btn, ...styles.btnSecondary }}
        >
          ↻ Reload
        </button>
        <button
          onClick={handleSaveConfig}
          disabled={!unsavedChanges || saving}
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            opacity: !unsavedChanges || saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving...' : '💾 Save'}
        </button>
        {unsavedChanges && (
          <span style={styles.unsavedWarning}>⚠️ Unsaved changes</span>
        )}
      </div>
    </div>
  );
};

const PathsConfig = ({ config, onChange }) => (
  <div style={styles.section}>
    <h3>Model Paths</h3>
    <div style={styles.formGroup}>
      <label>Models Directory:</label>
      <input
        type="text"
        value={config.paths?.modelsDirectory || ''}
        onChange={(e) =>
          onChange('paths', 'modelsDirectory', e.target.value)
        }
        style={styles.input}
        placeholder="/path/to/models"
      />
    </div>
    <div style={styles.formGroup}>
      <label>Logs Directory:</label>
      <input
        type="text"
        value={config.paths?.logsDirectory || ''}
        onChange={(e) => onChange('paths', 'logsDirectory', e.target.value)}
        style={styles.input}
        placeholder="/var/log/llama"
      />
    </div>
    <div style={styles.formGroup}>
      <label>Cache Directory:</label>
      <input
        type="text"
        value={config.paths?.cacheDirectory || ''}
        onChange={(e) => onChange('paths', 'cacheDirectory', e.target.value)}
        style={styles.input}
        placeholder="/tmp/llama-cache"
      />
    </div>
  </div>
);

const ProxiesConfig = ({ config, onChange }) => (
  <div style={styles.section}>
    <h3>Proxy Configuration</h3>

    <div style={styles.proxyCard}>
      <h4>Ollama</h4>
      <div style={styles.formGroup}>
        <label>
          <input
            type="checkbox"
            checked={config.proxies?.ollama?.enabled || false}
            onChange={(e) =>
              onChange('proxies', 'ollama', {
                ...config.proxies?.ollama,
                enabled: e.target.checked,
              })
            }
          />
          Enabled
        </label>
      </div>
      <div style={styles.formGroup}>
        <label>Port:</label>
        <input
          type="number"
          value={config.proxies?.ollama?.port || 11434}
          onChange={(e) =>
            onChange('proxies', 'ollama', {
              ...config.proxies?.ollama,
              port: parseInt(e.target.value),
            })
          }
          style={styles.input}
        />
      </div>
    </div>

    <div style={styles.proxyCard}>
      <h4>LMStudio</h4>
      <div style={styles.formGroup}>
        <label>
          <input
            type="checkbox"
            checked={config.proxies?.lmstudio?.enabled || false}
            onChange={(e) =>
              onChange('proxies', 'lmstudio', {
                ...config.proxies?.lmstudio,
                enabled: e.target.checked,
              })
            }
          />
          Enabled
        </label>
      </div>
      <div style={styles.formGroup}>
        <label>Port:</label>
        <input
          type="number"
          value={config.proxies?.lmstudio?.port || 1234}
          onChange={(e) =>
            onChange('proxies', 'lmstudio', {
              ...config.proxies?.lmstudio,
              port: parseInt(e.target.value),
            })
          }
          style={styles.input}
        />
      </div>
    </div>
  </div>
);

const MonitoringConfig = ({ config, onChange }) => (
  <div style={styles.section}>
    <h3>Monitoring</h3>
    <div style={styles.formGroup}>
      <label>Update Interval (ms):</label>
      <input
        type="number"
        value={config.monitoring?.updateInterval || 1000}
        onChange={(e) =>
          onChange('monitoring', 'updateInterval', parseInt(e.target.value))
        }
        style={styles.input}
      />
    </div>
    <div style={styles.formGroup}>
      <label>
        <input
          type="checkbox"
          checked={config.monitoring?.enableDetailedLogging || false}
          onChange={(e) =>
            onChange('monitoring', 'enableDetailedLogging', e.target.checked)
          }
        />
        Detailed Logging
      </label>
    </div>
    <div style={styles.formGroup}>
      <label>
        <input
          type="checkbox"
          checked={config.monitoring?.enableGpuMonitoring || false}
          onChange={(e) =>
            onChange('monitoring', 'enableGpuMonitoring', e.target.checked)
          }
        />
        GPU Monitoring
      </label>
    </div>
  </div>
);

const LoggingConfig = ({ config, onChange }) => (
  <div style={styles.section}>
    <h3>Logging</h3>
    <div style={styles.formGroup}>
      <label>Log Level:</label>
      <select
        value={config.logging?.level || 'info'}
        onChange={(e) => onChange('logging', 'level', e.target.value)}
        style={styles.input}
      >
        <option value="debug">Debug</option>
        <option value="info">Info</option>
        <option value="warn">Warn</option>
        <option value="error">Error</option>
      </select>
    </div>
    <div style={styles.formGroup}>
      <label>
        <input
          type="checkbox"
          checked={config.logging?.enableConsole || true}
          onChange={(e) => onChange('logging', 'enableConsole', e.target.checked)}
        />
        Console Output
      </label>
    </div>
  </div>
);

const styles = {
  container: {
    padding: '2rem',
  },
  title: {
    marginBottom: '2rem',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    borderBottom: '1px solid var(--border-color)',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  tabActive: {
    color: 'var(--color-primary)',
    borderBottomColor: 'var(--color-primary)',
  },
  section: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    marginTop: '0.25rem',
  },
  proxyCard: {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1rem',
  },
  footer: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-color)',
  },
  btn: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  btnPrimary: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
  },
  btnSecondary: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  },
  unsavedWarning: {
    color: 'var(--color-warning)',
    fontWeight: '600',
    marginLeft: 'auto',
  },
};

export default ConfigurationPage;
