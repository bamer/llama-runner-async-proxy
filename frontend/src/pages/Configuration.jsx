import React, { useEffect, useState } from 'react';
import { useConfigStore } from '../store';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import axios from 'axios';

const ConfigurationPage = () => {
  const [activeTab, setActiveTab] = useState('paths');
  const [config, setConfig] = useState(null);
  const [modelDefaults, setModelDefaults] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
    loadModelDefaults();
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

  const loadModelDefaults = async () => {
    try {
      const res = await axios.get('/api/v1/config/defaults');
      setModelDefaults(res.data);
    } catch (error) {
      console.error('Failed to load model defaults:', error);
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

  const handleModelDefaultChange = (key, value) => {
    setModelDefaults((prev) => ({
      ...prev,
      [key]: value,
    }));
    setUnsavedChanges(true);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.updateConfig(config);
      if (modelDefaults) {
        await axios.post('/api/v1/config/defaults', modelDefaults);
      }
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
        {['paths', 'proxies', 'monitoring', 'logging', 'defaults'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab === 'paths' && '📁 Paths'}
            {tab === 'proxies' && '🔗 Proxies'}
            {tab === 'monitoring' && '📊 Monitoring'}
            {tab === 'logging' && '📝 Logging'}
            {tab === 'defaults' && '🎯 Model Defaults'}
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

      {activeTab === 'defaults' && modelDefaults && (
        <ModelDefaultsConfig config={modelDefaults} onChange={handleModelDefaultChange} />
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
    <h3>📁 Model Paths</h3>
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
    <h3>🔗 Proxy Configuration</h3>

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
    <h3>📊 Monitoring Configuration</h3>
    <div style={styles.formGroup}>
      <label>
        <input
          type="checkbox"
          checked={config.monitoring?.enabled || false}
          onChange={(e) =>
            onChange('monitoring', 'enabled', e.target.checked)
          }
        />
        Enable Monitoring
      </label>
    </div>
    <div style={styles.formGroup}>
      <label>Update Interval (ms):</label>
      <input
        type="number"
        value={config.monitoring?.updateInterval || 2000}
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
          checked={config.monitoring?.gpu || false}
          onChange={(e) =>
            onChange('monitoring', 'gpu', e.target.checked)
          }
        />
        Monitor GPU
      </label>
    </div>
  </div>
);

const LoggingConfig = ({ config, onChange }) => (
  <div style={styles.section}>
    <h3>📝 Logging Configuration</h3>
    <div style={styles.formGroup}>
      <label>Log Level:</label>
      <select
        value={config.logging?.level || 'INFO'}
        onChange={(e) => onChange('logging', 'level', e.target.value)}
        style={styles.input}
      >
        <option value="DEBUG">DEBUG</option>
        <option value="INFO">INFO</option>
        <option value="WARNING">WARNING</option>
        <option value="ERROR">ERROR</option>
      </select>
    </div>
    <div style={styles.formGroup}>
      <label>
        <input
          type="checkbox"
          checked={config.logging?.console || true}
          onChange={(e) =>
            onChange('logging', 'console', e.target.checked)
          }
        />
        Log to Console
      </label>
    </div>
    <div style={styles.formGroup}>
      <label>
        <input
          type="checkbox"
          checked={config.logging?.file || true}
          onChange={(e) =>
            onChange('logging', 'file', e.target.checked)
          }
        />
        Log to File
      </label>
    </div>
  </div>
);

const ModelDefaultsConfig = ({ config, onChange }) => (
  <div style={styles.section}>
    <h3>🎯 Default Model Configuration</h3>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>These settings will be applied to all new models by default</p>
    
    <div style={styles.configGrid}>
      <div style={styles.configSection}>
        <h4>Core Parameters</h4>
        <div style={styles.formGroup}>
          <label>Context Size (n_ctx):</label>
          <input
            type="number"
            value={config.n_ctx || 2048}
            onChange={(e) => onChange('n_ctx', parseInt(e.target.value))}
            style={styles.input}
            min="128"
            max="32768"
            step="128"
          />
        </div>
        <div style={styles.formGroup}>
          <label>Batch Size (n_batch):</label>
          <input
            type="number"
            value={config.n_batch || 512}
            onChange={(e) => onChange('n_batch', parseInt(e.target.value))}
            style={styles.input}
            min="1"
            max="2048"
          />
        </div>
        <div style={styles.formGroup}>
          <label>GPU Layers (n_gpu_layers):</label>
          <input
            type="number"
            value={config.n_gpu_layers || 0}
            onChange={(e) => onChange('n_gpu_layers', parseInt(e.target.value))}
            style={styles.input}
            min="0"
            max="100"
          />
        </div>
      </div>

      <div style={styles.configSection}>
        <h4>Generation Parameters</h4>
        <div style={styles.formGroup}>
          <label>Temperature:</label>
          <input
            type="number"
            value={config.temperature || 0.7}
            onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
            style={styles.input}
            min="0"
            max="2"
            step="0.01"
          />
        </div>
        <div style={styles.formGroup}>
          <label>Top P:</label>
          <input
            type="number"
            value={config.top_p || 0.9}
            onChange={(e) => onChange('top_p', parseFloat(e.target.value))}
            style={styles.input}
            min="0"
            max="1"
            step="0.01"
          />
        </div>
        <div style={styles.formGroup}>
          <label>Top K:</label>
          <input
            type="number"
            value={config.top_k || 40}
            onChange={(e) => onChange('top_k', parseInt(e.target.value))}
            style={styles.input}
            min="0"
            max="100"
          />
        </div>
      </div>

      <div style={styles.configSection}>
        <h4>Advanced Options</h4>
        <div style={styles.formGroup}>
          <label>Repeat Penalty:</label>
          <input
            type="number"
            value={config.repeat_penalty || 1.1}
            onChange={(e) => onChange('repeat_penalty', parseFloat(e.target.value))}
            style={styles.input}
            min="1"
            max="2"
            step="0.01"
          />
        </div>
        <div style={styles.formGroup}>
          <label>Max Tokens (num_predict):</label>
          <input
            type="number"
            value={config.num_predict || 512}
            onChange={(e) => onChange('num_predict', parseInt(e.target.value))}
            style={styles.input}
            min="1"
            max="32768"
          />
        </div>
      </div>
    </div>
  </div>
);

const styles = {
  container: { padding: '2rem', backgroundColor: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' },
  title: { color: 'var(--text-primary)', marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' },
  tab: { padding: '0.75rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  tabActive: { color: 'var(--color-primary)', fontWeight: 'bold', borderBottom: '3px solid var(--color-primary)', marginBottom: '-2px' },
  section: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '2rem', marginBottom: '2rem' },
  configGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1.5rem' },
  configSection: { backgroundColor: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' },
  formGroup: { marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  input: { padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.95rem' },
  proxyCard: { backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' },
  btn: { padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' },
  btnPrimary: { backgroundColor: 'var(--color-success)' },
  btnSecondary: { backgroundColor: 'var(--color-warning)' },
  footer: { display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' },
  unsavedWarning: { color: 'var(--color-warning)', fontWeight: 'bold' },
};

export default ConfigurationPage;
