import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConfigPage = () => {
  const [config, setConfig] = useState({});
  const [modelsPath, setModelsPath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await axios.get('/api/v1/config/defaults');
      setConfig(res.data);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handlePathChange = (e) => {
    setModelsPath(e.target.value);
    setHasChanges(true);
  };

  const handleConfigChange = (key, value) => {
    setConfig({ ...config, [key]: value });
    setHasChanges(true);
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      // Save models path
      if (modelsPath) {
        await axios.post('/api/v1/config/paths', {
          modelsPath: modelsPath,
        });
      }

      // Save config
      await axios.post('/api/v1/config', config);
      alert('Configuration saved successfully');
      setHasChanges(false);
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>⚙️ Configuration</h2>

      <div style={styles.section}>
        <h3>📁 Model Discovery</h3>
        <div style={styles.formGroup}>
          <label>Models Directory Path:</label>
          <input
            type="text"
            value={modelsPath}
            onChange={handlePathChange}
            placeholder="e.g., /media/bamer/crucial MX300/llm/llama/models"
            style={styles.input}
          />
          <small style={styles.help}>
            Set the directory where your GGUF/BIN model files are stored
          </small>
        </div>
      </div>

      <div style={styles.section}>
        <h3>🔧 Proxy Services</h3>
        <div style={styles.row2}>
          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={config.ollama_enabled || false}
                onChange={(e) => handleConfigChange('ollama_enabled', e.target.checked)}
              />
              Ollama Proxy Enabled
            </label>
            <input
              type="number"
              value={config.ollama_port || 11434}
              onChange={(e) => handleConfigChange('ollama_port', parseInt(e.target.value))}
              placeholder="Port"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={config.lmstudio_enabled || false}
                onChange={(e) => handleConfigChange('lmstudio_enabled', e.target.checked)}
              />
              LM Studio Proxy Enabled
            </label>
            <input
              type="number"
              value={config.lmstudio_port || 1234}
              onChange={(e) => handleConfigChange('lmstudio_port', parseInt(e.target.value))}
              placeholder="Port"
              style={styles.input}
            />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3>🖥️ Web UI</h3>
        <div style={styles.row2}>
          <div style={styles.formGroup}>
            <label>WebUI Port:</label>
            <input
              type="number"
              value={config.webui_port || 8081}
              onChange={(e) => handleConfigChange('webui_port', parseInt(e.target.value))}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>WebUI Host:</label>
            <input
              type="text"
              value={config.webui_host || '0.0.0.0'}
              onChange={(e) => handleConfigChange('webui_host', e.target.value)}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3>⚡ Model Runtime</h3>
        <div style={styles.row2}>
          <div style={styles.formGroup}>
            <label>Concurrent Runners:</label>
            <input
              type="number"
              min="1"
              value={config.concurrent_runners || 1}
              onChange={(e) => handleConfigChange('concurrent_runners', parseInt(e.target.value))}
              style={styles.input}
            />
            <small style={styles.help}>Max models to run simultaneously</small>
          </div>

          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={config.auto_gpu_detection || false}
                onChange={(e) => handleConfigChange('auto_gpu_detection', e.target.checked)}
              />
              Auto GPU Detection
            </label>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3>📊 Logging</h3>
        <div style={styles.row2}>
          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={config.prompt_logging || false}
                onChange={(e) => handleConfigChange('prompt_logging', e.target.checked)}
              />
              Enable Prompt Logging
            </label>
          </div>

          <div style={styles.formGroup}>
            <label>Log Level:</label>
            <select
              value={config.log_level || 'info'}
              onChange={(e) => handleConfigChange('log_level', e.target.value)}
              style={styles.input}
            >
              <option>debug</option>
              <option>info</option>
              <option>warn</option>
              <option>error</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          onClick={saveConfig}
          disabled={!hasChanges || isSaving}
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            opacity: (!hasChanges || isSaving) ? 0.5 : 1,
          }}
        >
          {isSaving ? '⏳ Saving...' : '💾 Save Configuration'}
        </button>
        <button
          onClick={() => {
            setModelsPath('');
            loadConfig();
            setHasChanges(false);
          }}
          style={{ ...styles.btn, ...styles.btnSecondary }}
        >
          ↺ Reset
        </button>
      </div>

      {hasChanges && (
        <div style={styles.warning}>
          ⚠️ You have unsaved changes
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  section: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' },
  formGroup: { marginBottom: '1rem' },
  row2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' },
  input: { width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' },
  help: { display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' },
  actions: { display: 'flex', gap: '1rem', marginTop: '2rem' },
  btn: { padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnPrimary: { backgroundColor: 'var(--color-primary)', color: 'white' },
  btnSecondary: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' },
  warning: { marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '0.5rem', color: '#f59e0b', fontSize: '0.875rem' },
};

export default ConfigPage;
