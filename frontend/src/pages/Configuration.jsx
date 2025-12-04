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

const DEFAULT_PARAMS = {
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

const ConfigurationPage = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [editingParams, setEditingParams] = useState({});
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    if (hasUnsavedChanges && selectedModel && Object.keys(editingParams).length > 0) {
      const timer = setTimeout(() => {
        saveModelConfig();
      }, 3000);
      setAutoSaveTimer(timer);
    }
    return () => { if (autoSaveTimer) clearTimeout(autoSaveTimer); };
  }, [editingParams, hasUnsavedChanges, selectedModel]);

  const loadModels = async () => {
    try {
      const res = await axios.get('/api/v1/models');
      setModels(res.data.models || []);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const saveModelConfig = async () => {
    if (!selectedModel) return;
    
    setIsSaving(true);
    try {
      await axios.put(`/api/v1/models/${selectedModel.name}/config`, { config: editingParams });
      
      setHasUnsavedChanges(false);
      setSaveStatus('Configuration saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveStatus('Error saving configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleParamChange = (key, value) => {
    setEditingParams(prev => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const selectModel = (model) => {
    setSelectedModel(model);
    
    // Load model config
    if (model.config) {
      const merged = { ...DEFAULT_PARAMS, ...model.config };
      setEditingParams(merged);
    } else {
      setEditingParams(DEFAULT_PARAMS);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Configuration</h2>
      
      {saveStatus && (
        <div style={{ ...styles.saveStatus, backgroundColor: saveStatus.includes('successfully') ? '#d1fae5' : '#fee2e2' }}>
          {saveStatus}
        </div>
      )}

      <div style={styles.mainLayout}>
        {/* Models List */}
        <div style={styles.modelsList}>
          <h3>Registered Models</h3>
          <div style={styles.modelsGrid}>
            {models.length === 0 ? (
              <p style={styles.noModels}>No models registered yet</p>
            ) : (
              models.map((model) => (
                <div 
                  key={model.name} 
                  style={{ ...styles.modelCard, ...(selectedModel?.name === model.name ? styles.modelCardActive : {}) }} 
                  onClick={() => selectModel(model)}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{model.name}</h4>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                    <p style={{ margin: '0.2rem 0' }}>📦 {model.format || 'Unknown'}</p>
                    <p style={{ margin: '0.2rem 0' }}>💾 {model.sizeGB ? `${typeof model.sizeGB === 'number' ? model.sizeGB.toFixed(1) : model.sizeGB}GB` : 'Unknown size'}</p>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', fontWeight: '600' }}>
                    Status: <span style={{ fontWeight: '700', color: model.status === 'running' ? '#4caf50' : model.status === 'loading' ? '#ff9800' : '#999' }}>
                      {model.status === 'running' ? '🟢' : model.status === 'loading' ? '🟡' : '🔴'} {model.status}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        <div style={styles.configPanel}>
          {selectedModel ? (
            <>
              <h3>Configure {selectedModel.name}</h3>
              
              <div style={styles.configSection}>
                <h4>Core Parameters</h4>
                <ParameterControl label="Context Size" type="number" value={editingParams.ctx_size} onChange={(v) => handleParamChange('ctx_size', v)} min={128} max={32768} step={128} description={PARAMETER_DESCRIPTIONS.ctx_size} />
                <ParameterControl label="Batch Size" type="number" value={editingParams.batch_size} onChange={(v) => handleParamChange('batch_size', v)} min={1} max={4096} step={1} description={PARAMETER_DESCRIPTIONS.batch_size} />
                <ParameterControl label="Ubatch Size" type="number" value={editingParams.ubatch_size} onChange={(v) => handleParamChange('ubatch_size', v)} min={1} max={2048} step={1} description={PARAMETER_DESCRIPTIONS.ubatch_size} />
                <ParameterControl label="Threads" type="number" value={editingParams.threads} onChange={(v) => handleParamChange('threads', v)} min={-1} max={64} step={1} description={PARAMETER_DESCRIPTIONS.threads} />
                <ParameterControl label="Batch Threads" type="number" value={editingParams.threads_batch} onChange={(v) => handleParamChange('threads_batch', v)} min={-1} max={64} step={1} description={PARAMETER_DESCRIPTIONS.threads_batch} />
              </div>

              <div style={styles.configSection}>
                <h4>GPU Parameters</h4>
                <ParameterControl label="GPU Layers" type="number" value={editingParams.gpu_layers} onChange={(v) => handleParamChange('gpu_layers', v)} min={-1} max={100} step={1} description={PARAMETER_DESCRIPTIONS.gpu_layers} />
                <ParameterControl label="CPU MoE" type="number" value={editingParams.n_cpu_moe} onChange={(v) => handleParamChange('n_cpu_moe', v)} min={0} max={100} step={1} description={PARAMETER_DESCRIPTIONS.n_cpu_moe} />
              </div>

              <div style={styles.configSection}>
                <h4>Generation Parameters</h4>
                <ParameterControl label="Temperature" type="number" value={editingParams.temperature} onChange={(v) => handleParamChange('temperature', v)} min={0} max={2} step={0.01} description={PARAMETER_DESCRIPTIONS.temperature} />
                <ParameterControl label="Top P" type="number" value={editingParams.top_p} onChange={(v) => handleParamChange('top_p', v)} min={0} max={1} step={0.01} description={PARAMETER_DESCRIPTIONS.top_p} />
                <ParameterControl label="Top K" type="number" value={editingParams.top_k} onChange={(v) => handleParamChange('top_k', v)} min={0} max={100} step={1} description={PARAMETER_DESCRIPTIONS.top_k} />
                <ParameterControl label="Repeat Penalty" type="number" value={editingParams.repeat_penalty} onChange={(v) => handleParamChange('repeat_penalty', v)} min={1} max={2} step={0.01} description={PARAMETER_DESCRIPTIONS.repeat_penalty} />
              </div>

              <div style={styles.configSection}>
                <h4>Advanced Options</h4>
                <ParameterControl label="Max Tokens" type="number" value={editingParams.n_predict} onChange={(v) => handleParamChange('n_predict', v)} min={-1} max={32768} step={1} description={PARAMETER_DESCRIPTIONS.n_predict} />
                <ParameterControl label="Seed" type="number" value={editingParams.seed} onChange={(v) => handleParamChange('seed', v)} min={-1} max={2147483647} step={1} description={PARAMETER_DESCRIPTIONS.seed} />
                <ParameterControl label="Penalize NL" type="checkbox" checked={editingParams.penalize_nl} onChange={(v) => handleParamChange('penalize_nl', v)} description={PARAMETER_DESCRIPTIONS.penalize_nl} />
                <ParameterControl label="Presence Penalty" type="number" value={editingParams.presence_penalty} onChange={(v) => handleParamChange('presence_penalty', v)} min={0} max={1} step={0.01} description={PARAMETER_DESCRIPTIONS.presence_penalty} />
                <ParameterControl label="Frequency Penalty" type="number" value={editingParams.frequency_penalty} onChange={(v) => handleParamChange('frequency_penalty', v)} min={0} max={1} step={0.01} description={PARAMETER_DESCRIPTIONS.frequency_penalty} />
                <ParameterControl label="Mirostat" type="number" value={editingParams.mirostat} onChange={(v) => handleParamChange('mirostat', v)} min={0} max={2} step={1} description={PARAMETER_DESCRIPTIONS.mirostat} />
                <ParameterControl label="Mirostat Tau" type="number" value={editingParams.mirostat_tau} onChange={(v) => handleParamChange('mirostat_tau', v)} min={0} max={10} step={0.1} description={PARAMETER_DESCRIPTIONS.mirostat_tau} />
                <ParameterControl label="Mirostat Eta" type="number" value={editingParams.mirostat_eta} onChange={(v) => handleParamChange('mirostat_eta', v)} min={0} max={1} step={0.01} description={PARAMETER_DESCRIPTIONS.mirostat_eta} />
              </div>

              {hasUnsavedChanges && <div style={styles.unsavedWarning}>⚠️ Unsaved changes - auto-save in 3s</div>}
              <button onClick={saveModelConfig} disabled={isSaving} style={{ ...styles.saveBtn, backgroundColor: saveStatus.includes('successfully') ? '#059669' : '#3b82f6' }}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </>
          ) : (
            <div style={styles.placeholder}>
              <p>Select a model to configure its parameters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '2rem', backgroundColor: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' },
  title: { color: 'var(--text-primary)', marginBottom: '1.5rem' },
  saveStatus: { padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' },
  mainLayout: { display: 'flex', gap: '2rem' },
  modelsList: { flex: 1, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem' },
  modelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
  modelCard: { backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s' },
  modelCardActive: { backgroundColor: 'var(--color-primary)', color: 'white', border: '2px solid var(--color-primary)' },
  noModels: { color: 'var(--text-tertiary)', fontStyle: 'italic' },
  configPanel: { width: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem' },
  configSection: { backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '1rem' },
  unsavedWarning: { padding: '0.75rem', backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid #ffc107', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' },
  saveBtn: { width: '100%', padding: '0.75rem', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s' },
  placeholder: { textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' },
};

export default ConfigurationPage;
