import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PARAMETER_DESCRIPTIONS = {
  ctx_size: 'Context window size - Maximum tokens the model can process',
  batch_size: 'Batch size - Number of tokens to process in parallel',
  ubatch_size: 'Physical batch size - Hardware-level batch size',
  threads: 'CPU threads - Number of threads for CPU inference (-1 = auto)',
  threads_batch: 'Batch threads - Threads for batch processing (-1 = same as threads)',
  n_predict: 'Maximum tokens to generate (-1 = unlimited)',
  seed: 'Random seed - For reproducible results (-1 = random)',
  gpu_layers: 'GPU layers - Number of model layers to load on GPU (-1 = all)',
  n_cpu_moe: 'CPU MoE layers - Keep Mixture of Experts layers on CPU',
  temperature: 'Randomness - Higher (0.7-1.0) = creative, lower (0.1-0.3) = deterministic',
  top_p: 'Nucleus sampling - Use only tokens in top P% probability',
  top_k: 'Top-K - Use only top K most likely tokens',
  repeat_penalty: 'Repeat penalty - Penalize repeated tokens',
  penalize_nl: 'Penalize newline - Include newline in repeat penalty',
  presence_penalty: 'Presence penalty - Penalize tokens already in context',
  frequency_penalty: 'Frequency penalty - Penalize common tokens',
  mirostat: 'Mirostat mode - 0=off, 1=v1, 2=v2',
  mirostat_tau: 'Mirostat tau - Controls diversity',
  mirostat_eta: 'Mirostat eta - Learning rate',
};

const DEFAULT_MODEL_PARAMS = {
  ctx_size: 4096,
  batch_size: 2048,
  ubatch_size: 512,
  threads: -1,
  threads_batch: -1,
  n_predict: -1,
  seed: -1,
  gpu_layers: -1,
  n_cpu_moe: 0,
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  repeat_penalty: 1.1,
  penalize_nl: false,
  presence_penalty: 0.0,
  frequency_penalty: 0.0,
  mirostat: 0,
  mirostat_tau: 5.0,
  mirostat_eta: 0.1,
};

const ParameterControl = ({ label, type, value, onChange, min, max, step, checked, options = [], description }) => {
  const [showHelp, setShowHelp] = useState(false);
  
  if (type === 'checkbox') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', position: 'relative' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
          <input type="checkbox" checked={checked || false} onChange={(e) => onChange(e.target.checked)} style={{ cursor: 'pointer' }} />
          <span style={{ fontSize: '0.9rem' }}>{label}</span>
        </label>
        {description && <span style={{ cursor: 'help', fontSize: '0.8rem', color: 'var(--color-info)' }} onMouseEnter={() => setShowHelp(true)} onMouseLeave={() => setShowHelp(false)}>ℹ️</span>}
        {showHelp && description && <div style={{ position: 'absolute', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.75rem', maxWidth: '220px', zIndex: 10, right: '0', top: '100%', marginTop: '0.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{description}</div>}
      </div>
    );
  }
  
  if (type === 'select') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem', position: 'relative' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: '500', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {label}
          {description && <span style={{ cursor: 'help', fontSize: '0.8rem', color: 'var(--color-info)' }} onMouseEnter={() => setShowHelp(true)} onMouseLeave={() => setShowHelp(false)}>ℹ️</span>}
        </label>
        {showHelp && description && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{description}</div>}
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          <option value="">--Select--</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem', position: 'relative' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: '500', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {label} {value !== undefined && value !== null && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({value})</span>}
        {description && <span style={{ cursor: 'help', fontSize: '0.8rem', color: 'var(--color-info)' }} onMouseEnter={() => setShowHelp(true)} onMouseLeave={() => setShowHelp(false)}>ℹ️</span>}
      </label>
      {showHelp && description && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{description}</div>}
      <input type={type} value={value !== undefined && value !== null ? value : ''} onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} min={min} max={max} step={step} />
    </div>
  );
};

const SettingsPage = () => {
  // State for application settings
  const [appSettings, setAppSettings] = useState({
    modelsDirectory: '',
    serverHost: 'localhost',
    serverPort: 8080,
    enableCors: true,
    logLevel: 'info',
    maxConcurrentModels: 5,
    enableGpu: true,
    defaultGpuLayers: -1,
    enableWebSocket: true,
    enableMetrics: true,
    metricsInterval: 5000,
  });

  // State for default model configuration
  const [defaultModelConfig, setDefaultModelConfig] = useState(DEFAULT_MODEL_PARAMS);
  
  // State for system preferences
  const [systemPreferences, setSystemPreferences] = useState({
    theme: 'light',
    language: 'en',
    autoSave: true,
    autoSaveInterval: 3000,
    enableNotifications: true,
    enableSounds: false,
    backupEnabled: true,
    backupInterval: 'daily',
    maxBackups: 7,
  });

  // State for UI
  const [activeTab, setActiveTab] = useState('application');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    if (hasUnsavedChanges && systemPreferences.autoSave) {
      const timer = setTimeout(() => {
        saveAllSettings();
      }, systemPreferences.autoSaveInterval);
      setAutoSaveTimer(timer);
    }
    return () => { if (autoSaveTimer) clearTimeout(autoSaveTimer); };
  }, [hasUnsavedChanges, systemPreferences.autoSave, systemPreferences.autoSaveInterval]);

  const loadSettings = async () => {
    try {
      // Load application settings
      const appResponse = await axios.get('/api/v1/config/application');
      if (appResponse.data) {
        setAppSettings(prev => ({ ...prev, ...appResponse.data }));
      }

      // Load default model configuration
      const modelResponse = await axios.get('/api/v1/config/defaults');
      if (modelResponse.data) {
        setDefaultModelConfig(prev => ({ ...prev, ...modelResponse.data }));
      }

      // Load system preferences (from localStorage or API)
      const prefsResponse = await axios.get('/api/v1/config/preferences');
      if (prefsResponse.data) {
        setSystemPreferences(prev => ({ ...prev, ...prefsResponse.data }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveAllSettings = async () => {
    setIsSaving(true);
    try {
      // Save application settings
      await axios.post('/api/v1/config/application', appSettings);

      // Save default model configuration
      await axios.post('/api/v1/config/defaults', defaultModelConfig);

      // Save system preferences
      await axios.post('/api/v1/config/preferences', systemPreferences);

      setHasUnsavedChanges(false);
      setSaveStatus('All settings saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppSettingChange = (key, value) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleModelConfigChange = (key, value) => {
    setDefaultModelConfig(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handlePreferenceChange = (key, value) => {
    setSystemPreferences(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await axios.post('/api/v1/config/reset');
        await loadSettings();
        setSaveStatus('Settings reset to defaults');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (error) {
        console.error('Error resetting settings:', error);
        setSaveStatus('Error resetting settings');
      }
    }
  };

  const exportSettings = async () => {
    try {
      const settings = {
        application: appSettings,
        defaultModel: defaultModelConfig,
        preferences: systemPreferences,
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `llama-runner-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting settings:', error);
      setSaveStatus('Error exporting settings');
    }
  };

  const importSettings = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      if (settings.application) {
        setAppSettings(prev => ({ ...prev, ...settings.application }));
      }
      if (settings.defaultModel) {
        setDefaultModelConfig(prev => ({ ...prev, ...settings.defaultModel }));
      }
      if (settings.preferences) {
        setSystemPreferences(prev => ({ ...prev, ...settings.preferences }));
      }
      
      setHasUnsavedChanges(true);
      setSaveStatus('Settings imported successfully');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error importing settings:', error);
      setSaveStatus('Error importing settings');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚙️ Settings</h1>
        <div style={styles.headerActions}>
          <button onClick={exportSettings} style={styles.exportBtn}>
            📤 Export
          </button>
          <label style={styles.importBtn}>
            📥 Import
            <input type="file" accept=".json" onChange={importSettings} style={{ display: 'none' }} />
          </label>
          <button onClick={resetToDefaults} style={styles.resetBtn}>
            🔄 Reset
          </button>
        </div>
      </div>

      {saveStatus && (
        <div style={{ ...styles.statusMessage, backgroundColor: saveStatus.includes('successfully') ? '#d1fae5' : '#fee2e2' }}>
          {saveStatus}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={styles.tabs}>
        {[
          { id: 'application', label: 'Application Settings', icon: '🖥️' },
          { id: 'defaults', label: 'Default Model Config', icon: '🤖' },
          { id: 'preferences', label: 'System Preferences', icon: '🎨' },
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Application Settings */}
      {activeTab === 'application' && (
        <div style={styles.content}>
          <div style={styles.section}>
            <h3>📁 Models Directory</h3>
            <div style={styles.formGroup}>
              <ParameterControl 
                label="Models Directory Path" 
                type="text" 
                value={appSettings.modelsDirectory} 
                onChange={(v) => handleAppSettingChange('modelsDirectory', v)} 
                description="Path to the directory containing model files"
              />
            </div>
          </div>

          <div style={styles.section}>
            <h3>🌐 Server Configuration</h3>
            <ParameterControl 
              label="Server Host" 
              type="text" 
              value={appSettings.serverHost} 
              onChange={(v) => handleAppSettingChange('serverHost', v)} 
              description="Server host address"
            />
            <ParameterControl 
              label="Server Port" 
              type="number" 
              value={appSettings.serverPort} 
              onChange={(v) => handleAppSettingChange('serverPort', v)} 
              min={1024} 
              max={65535} 
              description="Server port number"
            />
            <ParameterControl 
              label="Enable CORS" 
              type="checkbox" 
              checked={appSettings.enableCors} 
              onChange={(v) => handleAppSettingChange('enableCors', v)} 
              description="Enable Cross-Origin Resource Sharing"
            />
          </div>

          <div style={styles.section}>
            <h3>📊 Performance Settings</h3>
            <ParameterControl 
              label="Max Concurrent Models" 
              type="number" 
              value={appSettings.maxConcurrentModels} 
              onChange={(v) => handleAppSettingChange('maxConcurrentModels', v)} 
              min={1} 
              max={20} 
              description="Maximum number of models that can run simultaneously"
            />
            <ParameterControl 
              label="Enable GPU" 
              type="checkbox" 
              checked={appSettings.enableGpu} 
              onChange={(v) => handleAppSettingChange('enableGpu', v)} 
              description="Enable GPU acceleration"
            />
            <ParameterControl 
              label="Default GPU Layers" 
              type="number" 
              value={appSettings.defaultGpuLayers} 
              onChange={(v) => handleAppSettingChange('defaultGpuLayers', v)} 
              min={-1} 
              max={100} 
              description="Default number of layers to offload to GPU (-1 = all)"
            />
          </div>

          <div style={styles.section}>
            <h3>📈 Monitoring & Logging</h3>
            <ParameterControl 
              label="Log Level" 
              type="select" 
              value={appSettings.logLevel} 
              onChange={(v) => handleAppSettingChange('logLevel', v)} 
              options={['debug', 'info', 'warn', 'error']} 
              description="Minimum log level to output"
            />
            <ParameterControl 
              label="Enable WebSocket" 
              type="checkbox" 
              checked={appSettings.enableWebSocket} 
              onChange={(v) => handleAppSettingChange('enableWebSocket', v)} 
              description="Enable real-time WebSocket communication"
            />
            <ParameterControl 
              label="Enable Metrics" 
              type="checkbox" 
              checked={appSettings.enableMetrics} 
              onChange={(v) => handleAppSettingChange('enableMetrics', v)} 
              description="Enable system metrics collection"
            />
            <ParameterControl 
              label="Metrics Interval (ms)" 
              type="number" 
              value={appSettings.metricsInterval} 
              onChange={(v) => handleAppSettingChange('metricsInterval', v)} 
              min={1000} 
              max={60000} 
              step={1000}
              description="Interval between metrics collection"
            />
          </div>
        </div>
      )}

      {/* Default Model Configuration */}
      {activeTab === 'defaults' && (
        <div style={styles.content}>
          <div style={styles.infoBox}>
            <p>⚠️ These settings will be applied as defaults to newly discovered models. Individual models can override these settings in the Models section.</p>
          </div>

          <div style={styles.section}>
            <h3>🔧 Core Parameters</h3>
            <ParameterControl label="Context Size" type="number" value={defaultModelConfig.ctx_size} onChange={(v) => handleModelConfigChange('ctx_size', v)} min={128} max={32768} step={128} description={PARAMETER_DESCRIPTIONS.ctx_size} />
            <ParameterControl label="Batch Size" type="number" value={defaultModelConfig.batch_size} onChange={(v) => handleModelConfigChange('batch_size', v)} min={1} max={4096} step={1} description={PARAMETER_DESCRIPTIONS.batch_size} />
            <ParameterControl label="Ubatch Size" type="number" value={defaultModelConfig.ubatch_size} onChange={(v) => handleModelConfigChange('ubatch_size', v)} min={1} max={2048} step={1} description={PARAMETER_DESCRIPTIONS.ubatch_size} />
            <ParameterControl label="Threads" type="number" value={defaultModelConfig.threads} onChange={(v) => handleModelConfigChange('threads', v)} min={-1} max={64} step={1} description={PARAMETER_DESCRIPTIONS.threads} />
            <ParameterControl label="Batch Threads" type="number" value={defaultModelConfig.threads_batch} onChange={(v) => handleModelConfigChange('threads_batch', v)} min={-1} max={64} step={1} description={PARAMETER_DESCRIPTIONS.threads_batch} />
          </div>

          <div style={styles.section}>
            <h3>🎮 GPU Parameters</h3>
            <ParameterControl label="GPU Layers" type="number" value={defaultModelConfig.gpu_layers} onChange={(v) => handleModelConfigChange('gpu_layers', v)} min={-1} max={100} step={1} description={PARAMETER_DESCRIPTIONS.gpu_layers} />
            <ParameterControl label="CPU MoE" type="number" value={defaultModelConfig.n_cpu_moe} onChange={(v) => handleModelConfigChange('n_cpu_moe', v)} min={0} max={100} step={1} description={PARAMETER_DESCRIPTIONS.n_cpu_moe} />
          </div>

          <div style={styles.section}>
            <h3>🎯 Generation Parameters</h3>
            <ParameterControl label="Temperature" type="number" value={defaultModelConfig.temperature} onChange={(v) => handleModelConfigChange('temperature', v)} min={0} max={2} step={0.01} description={PARAMETER_DESCRIPTIONS.temperature} />
            <ParameterControl label="Top P" type="number" value={defaultModelConfig.top_p} onChange={(v) => handleModelConfigChange('top_p', v)} min={0} max={1} step={0.01} description={PARAMETER_DESCRIPTIONS.top_p} />
            <ParameterControl label="Top K" type="number" value={defaultModelConfig.top_k} onChange={(v) => handleModelConfigChange('top_k', v)} min={0} max={100} step={1} description={PARAMETER_DESCRIPTIONS.top_k} />
            <ParameterControl label="Repeat Penalty" type="number" value={defaultModelConfig.repeat_penalty} onChange={(v) => handleModelConfigChange('repeat_penalty', v)} min={1} max={2} step={0.01} description={PARAMETER_DESCRIPTIONS.repeat_penalty} />
          </div>

          <div style={styles.section}>
            <h3>⚙️ Advanced Options</h3>
            <ParameterControl label="Max Tokens" type="number" value={defaultModelConfig.n_predict} onChange={(v) => handleModelConfigChange('n_predict', v)} min={-1} max={32768} step={1} description={PARAMETER_DESCRIPTIONS.n_predict} />
            <ParameterControl label="Seed" type="number" value={defaultModelConfig.seed} onChange={(v) => handleModelConfigChange('seed', v)} min={-1} max={2147483647} step={1} description={PARAMETER_DESCRIPTIONS.seed} />
            <ParameterControl label="Penalize NL" type="checkbox" checked={defaultModelConfig.penalize_nl} onChange={(v) => handleModelConfigChange('penalize_nl', v)} description={PARAMETER_DESCRIPTIONS.penalize_nl} />
            <ParameterControl label="Presence Penalty" type="number" value={defaultModelConfig.presence_penalty} onChange={(v) => handleModelConfigChange('presence_penalty', v)} min={0} max={1} step={0.01} description={PARAMETER_DESCRIPTIONS.presence_penalty} />
            <ParameterControl label="Frequency Penalty" type="number" value={defaultModelConfig.frequency_penalty} onChange={(v) => handleModelConfigChange('frequency_penalty', v)} min={0} max={1} step={0.01} description={PARAMETER_DESCRIPTIONS.frequency_penalty} />
            <ParameterControl label="Mirostat" type="number" value={defaultModelConfig.mirostat} onChange={(v) => handleModelConfigChange('mirostat', v)} min={0} max={2} step={1} description={PARAMETER_DESCRIPTIONS.mirostat} />
            <ParameterControl label="Mirostat Tau" type="number" value={defaultModelConfig.mirostat_tau} onChange={(v) => handleModelConfigChange('mirostat_tau', v)} min={0} max={10} step={0.1} description={PARAMETER_DESCRIPTIONS.mirostat_tau} />
            <ParameterControl label="Mirostat Eta" type="number" value={defaultModelConfig.mirostat_eta} onChange={(v) => handleModelConfigChange('mirostat_eta', v)} min={0} max={1} step={0.01} description={PARAMETER_DESCRIPTIONS.mirostat_eta} />
          </div>
        </div>
      )}

      {/* System Preferences */}
      {activeTab === 'preferences' && (
        <div style={styles.content}>
          <div style={styles.section}>
            <h3>🎨 Appearance</h3>
            <ParameterControl 
              label="Theme" 
              type="select" 
              value={systemPreferences.theme} 
              onChange={(v) => handlePreferenceChange('theme', v)} 
              options={['light', 'dark', 'auto']} 
              description="Choose application theme"
            />
            <ParameterControl 
              label="Language" 
              type="select" 
              value={systemPreferences.language} 
              onChange={(v) => handlePreferenceChange('language', v)} 
              options={['en', 'es', 'fr', 'de', 'ja', 'zh']} 
              description="Interface language"
            />
          </div>

          <div style={styles.section}>
            <h3>💾 Auto-Save</h3>
            <ParameterControl 
              label="Enable Auto-Save" 
              type="checkbox" 
              checked={systemPreferences.autoSave} 
              onChange={(v) => handlePreferenceChange('autoSave', v)} 
              description="Automatically save changes"
            />
            <ParameterControl 
              label="Auto-Save Interval (ms)" 
              type="number" 
              value={systemPreferences.autoSaveInterval} 
              onChange={(v) => handlePreferenceChange('autoSaveInterval', v)} 
              min={1000} 
              max={30000} 
              step={1000}
              description="Delay before auto-saving changes"
            />
          </div>

          <div style={styles.section}>
            <h3>🔔 Notifications</h3>
            <ParameterControl 
              label="Enable Notifications" 
              type="checkbox" 
              checked={systemPreferences.enableNotifications} 
              onChange={(v) => handlePreferenceChange('enableNotifications', v)} 
              description="Show system notifications"
            />
            <ParameterControl 
              label="Enable Sounds" 
              type="checkbox" 
              checked={systemPreferences.enableSounds} 
              onChange={(v) => handlePreferenceChange('enableSounds', v)} 
              description="Play sound for notifications"
            />
          </div>

          <div style={styles.section}>
            <h3>🗄️ Backup & Recovery</h3>
            <ParameterControl 
              label="Enable Backup" 
              type="checkbox" 
              checked={systemPreferences.backupEnabled} 
              onChange={(v) => handlePreferenceChange('backupEnabled', v)} 
              description="Automatically backup settings"
            />
            <ParameterControl 
              label="Backup Interval" 
              type="select" 
              value={systemPreferences.backupInterval} 
              onChange={(v) => handlePreferenceChange('backupInterval', v)} 
              options={['hourly', 'daily', 'weekly']} 
              description="How often to create backups"
            />
            <ParameterControl 
              label="Max Backups" 
              type="number" 
              value={systemPreferences.maxBackups} 
              onChange={(v) => handlePreferenceChange('maxBackups', v)} 
              min={1} 
              max={30} 
              description="Maximum number of backups to keep"
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div style={styles.footer}>
        {hasUnsavedChanges && (
          <div style={styles.unsavedWarning}>
            ⚠️ You have unsaved changes
          </div>
        )}
        <button 
          onClick={saveAllSettings} 
          disabled={isSaving || !hasUnsavedChanges} 
          style={{ 
            ...styles.saveBtn, 
            backgroundColor: hasUnsavedChanges ? 'var(--color-success)' : 'var(--color-secondary)',
            cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed'
          }}
        >
          {isSaving ? '💾 Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    padding: '2rem', 
    backgroundColor: 'var(--bg-primary)', 
    minHeight: '100vh', 
    color: 'var(--text-primary)' 
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: { 
    color: 'var(--text-primary)', 
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: 0 
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
  },
  exportBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--color-info)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  importBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--color-warning)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  resetBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--color-danger)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statusMessage: { 
    padding: '1rem', 
    borderRadius: '0.5rem', 
    marginBottom: '2rem',
    fontWeight: '500'
  },
  tabs: { 
    display: 'flex', 
    gap: '0.5rem', 
    marginBottom: '2rem', 
    borderBottom: '2px solid var(--border-color)', 
    paddingBottom: '0.5rem' 
  },
  tab: { 
    padding: '0.75rem 1.5rem', 
    background: 'transparent', 
    border: 'none', 
    cursor: 'pointer', 
    color: 'var(--text-secondary)', 
    fontSize: '0.95rem', 
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tabIcon: {
    fontSize: '1.1rem',
  },
  tabActive: { 
    color: 'var(--color-primary)', 
    fontWeight: 'bold', 
    borderBottom: '3px solid var(--color-primary)' 
  },
  content: {
    maxWidth: '800px',
  },
  infoBox: {
    backgroundColor: 'var(--color-info)',
    color: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '2rem',
  },
  section: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  footer: {
    marginTop: '3rem',
    paddingTop: '2rem',
    borderTop: '2px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unsavedWarning: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    border: '1px solid #ffc107',
    borderRadius: '0.5rem',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  saveBtn: {
    padding: '0.75rem 2rem',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
};

export default SettingsPage;