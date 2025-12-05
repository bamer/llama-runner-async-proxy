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

const ModelsPage = () => {
  // State for models and discovery
  const [models, setModels] = useState([]);
  const [discoveredModels, setDiscoveredModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelsPath, setModelsPath] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedTab, setSelectedTab] = useState('list');
  const [selectedDiscoveredModels, setSelectedDiscoveredModels] = useState(new Set());
  
  // State for model actions
  const [isLoadingModel, setIsLoadingModel] = useState({});
  const [actionInProgress, setActionInProgress] = useState({});
  
  // State for configuration
  const [editingParams, setEditingParams] = useState({});
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [llamaOptions, setLlamaOptions] = useState(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadModels();
    loadConfig();
    loadLlamaOptions();
  }, []);

  useEffect(() => {
    if (selectedModel) {
      loadModelDetails(selectedModel.name);
      setHasUnsavedChanges(false);
    }
  }, [selectedModel]);

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

  const loadLlamaOptions = async () => {
    try {
      const res = await axios.get('/config/llama_options_reference.json');
      setLlamaOptions(res.data);
    } catch (error) {
      console.error('Error loading llama options:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await axios.get('/api/v1/config/defaults');
      if (res.data.models_dir) {
        setModelsPath(res.data.models_dir);
      } else if (res.data.paths?.modelsDirectory) {
        setModelsPath(res.data.paths.modelsDirectory);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadModels = async () => {
    try {
      const res = await axios.get('/api/v1/models');
      setModels(res.data.models || []);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadModelDetails = async (modelName) => {
    try {
      const res = await axios.get(`/api/v1/models/${modelName}`);
      const config = res.data.config || {};
      const merged = { ...DEFAULT_PARAMS, ...config };
      setEditingParams(merged);
    } catch (error) {
      console.error('Error loading model details:', error);
      setEditingParams(DEFAULT_PARAMS);
    }
  };

  // Model action handlers
  const startModel = async (model) => {
    setIsLoadingModel(prev => ({ ...prev, [model.name]: true }));
    setActionInProgress(prev => ({ ...prev, [model.name]: 'starting' }));
    try {
      await axios.post(`/api/v1/models/${model.name}/start`, { config: editingParams });
      loadModels();
    } catch (error) {
      console.error('Error starting model:', error);
      alert(`Error starting model: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoadingModel(prev => ({ ...prev, [model.name]: false }));
      setActionInProgress(prev => ({ ...prev, [model.name]: null }));
    }
  };

  const stopModel = async (model) => {
    setActionInProgress(prev => ({ ...prev, [model.name]: 'stopping' }));
    try {
      await axios.post(`/api/v1/models/${model.name}/stop`);
      loadModels();
    } catch (error) {
      console.error('Error stopping model:', error);
      alert(`Error stopping model: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionInProgress(prev => ({ ...prev, [model.name]: null }));
    }
  };

  const reloadModel = async (model) => {
    setActionInProgress(prev => ({ ...prev, [model.name]: 'reloading' }));
    try {
      await axios.post(`/api/v1/models/${model.name}/reload`);
      loadModels();
    } catch (error) {
      console.error('Error reloading model:', error);
      alert(`Error reloading model: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionInProgress(prev => ({ ...prev, [model.name]: null }));
    }
  };

  // Bulk actions
  const startAllModels = async () => {
    try {
      const stoppedModels = models.filter(m => m.status !== 'running');
      for (const model of stoppedModels) {
        await axios.post(`/api/v1/models/${model.name}/start`);
      }
      loadModels();
    } catch (error) {
      console.error('Error starting all models:', error);
      alert(`Error starting all models: ${error.response?.data?.message || error.message}`);
    }
  };

  const stopAllModels = async () => {
    try {
      const runningModels = models.filter(m => m.status === 'running');
      for (const model of runningModels) {
        await axios.post(`/api/v1/models/${model.name}/stop`);
      }
      loadModels();
    } catch (error) {
      console.error('Error stopping all models:', error);
      alert(`Error stopping all models: ${error.response?.data?.message || error.message}`);
    }
  };

  // Discovery handlers
  const discoverModels = async () => {
    if (!modelsPath) {
      alert('Please enter a path');
      return;
    }
    setIsDiscovering(true);
    try {
      const res = await axios.post('/api/v1/models/discover', { path: modelsPath, maxDepth: 3 });
      setDiscoveredModels((res.data.models || []).map(m => ({ ...m, models_dir: modelsPath })));
      setSelectedDiscoveredModels(new Set());
      alert(`Found ${res.data.count} model(s)`);
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const toggleDiscoveredModel = (idx) => {
    const newSelected = new Set(selectedDiscoveredModels);
    newSelected.has(idx) ? newSelected.delete(idx) : newSelected.add(idx);
    setSelectedDiscoveredModels(newSelected);
  };

  const registerSelectedModels = async () => {
    const modelsToRegister = discoveredModels.filter((_, idx) => selectedDiscoveredModels.has(idx)).map(m => ({ ...m, models_dir: modelsPath }));
    if (modelsToRegister.length === 0) {
      alert('No models selected');
      return;
    }
    setIsRegistering(true);
    try {
      const res = await axios.post('/api/v1/models/register', { models: modelsToRegister });
      alert(`Registered ${res.data.registered} model(s)`);
      loadModels();
      setSelectedDiscoveredModels(new Set());
    } catch (error) {
      alert(`Error registering models: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  // Configuration handlers
  const saveModelConfig = async () => {
    if (!selectedModel) return;
    try {
      await axios.put(`/api/v1/models/${selectedModel.name}/config`, { config: editingParams });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleParamChange = (key, value) => {
    setEditingParams(prev => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Filter and sort models
  const getFilteredAndSortedModels = () => {
    let filtered = models;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(model => 
        model.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(model => model.status === filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'size':
          return (parseFloat(a.sizeGB) || 0) - (parseFloat(b.sizeGB) || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const filteredModels = getFilteredAndSortedModels();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🤖 Models Management</h1>
        <div style={styles.bulkActions}>
          <button onClick={startAllModels} style={{ ...styles.bulkBtn, ...styles.startBtn }}>
            ▶️ Start All
          </button>
          <button onClick={stopAllModels} style={{ ...styles.bulkBtn, ...styles.stopBtn }}>
            ⏹️ Stop All
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabs}>
        {['list', 'discover', 'finetune'].map((tab) => (
          <button key={tab} onClick={() => setSelectedTab(tab)} style={{ ...styles.tab, ...(selectedTab === tab ? styles.tabActive : {}) }}>
            {tab === 'list' && '📋 Models'}
            {tab === 'discover' && '🔍 Discover'}
            {tab === 'finetune' && '🎯 Fine-Tune'}
          </button>
        ))}
      </div>

      <div style={styles.mainLayout}>
        {/* Left Panel - Model List */}
        <div style={styles.leftPanel}>
          {selectedTab === 'list' && (
            <>
              {/* Search and Filter Controls */}
              <div style={styles.controls}>
                <div style={styles.searchBox}>
                  <input 
                    type="text" 
                    placeholder="Search models..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                <div style={styles.filters}>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.filterSelect}>
                    <option value="all">All Status</option>
                    <option value="running">Running</option>
                    <option value="stopped">Stopped</option>
                    <option value="loading">Loading</option>
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.filterSelect}>
                    <option value="name">Sort by Name</option>
                    <option value="status">Sort by Status</option>
                    <option value="size">Sort by Size</option>
                  </select>
                </div>
              </div>

              {/* Models List */}
              <div style={styles.modelsList}>
                {filteredModels.length === 0 ? (
                  <p style={styles.noModels}>No models found</p>
                ) : (
                  filteredModels.map((model) => (
                    <div key={model.name} style={{ ...styles.modelCard, ...(selectedModel?.name === model.name ? styles.modelCardActive : {}) }} onClick={() => setSelectedModel(model)}>
                      <div style={styles.modelHeader}>
                        <h3 style={styles.modelName}>{model.name}</h3>
                        <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(model.status) }}>
                          {getStatusText(model.status)}
                        </span>
                      </div>
                      
                      <div style={styles.modelInfo}>
                        <p>📦 {model.format || 'Unknown'}</p>
                        <p>💾 {model.sizeGB ? `${typeof model.sizeGB === 'number' ? model.sizeGB.toFixed(1) : model.sizeGB}GB` : 'Unknown size'}</p>
                        {model.lastModified && <p>📅 {new Date(model.lastModified).toLocaleDateString()}</p>}
                        {model.port && <p>🔌 Port {model.port}</p>}
                      </div>
                      
                      <div style={styles.modelActions}>
                        {model.status === 'running' ? (
                          <>
                            <button 
                              style={{ ...styles.actionBtn, ...styles.stopBtn }} 
                              onClick={(e) => { e.stopPropagation(); stopModel(model); }}
                              disabled={actionInProgress[model.name] === 'stopping'}
                            >
                              {actionInProgress[model.name] === 'stopping' ? '⏳' : '⏹️'} Stop
                            </button>
                            <button 
                              style={{ ...styles.actionBtn, ...styles.reloadBtn }} 
                              onClick={(e) => { e.stopPropagation(); reloadModel(model); }}
                              disabled={actionInProgress[model.name] === 'reloading'}
                            >
                              {actionInProgress[model.name] === 'reloading' ? '⏳' : '🔄'} Reload
                            </button>
                          </>
                        ) : (
                          <button 
                            style={{ ...styles.actionBtn, ...styles.startBtn }} 
                            onClick={(e) => { e.stopPropagation(); startModel(model); }}
                            disabled={isLoadingModel[model.name] || actionInProgress[model.name] === 'starting'}
                          >
                            {isLoadingModel[model.name] || actionInProgress[model.name] === 'starting' ? '⏳ Loading...' : '▶️ Start'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {selectedTab === 'discover' && (
            <div style={styles.discoverSection}>
              <h3>Discover Models</h3>
              <div style={styles.formGroup}>
                <label>Directory Path:</label>
                <input type="text" value={modelsPath} onChange={(e) => setModelsPath(e.target.value)} style={styles.input} placeholder="/path/to/models" />
              </div>
              <button onClick={discoverModels} disabled={isDiscovering} style={styles.btn}>
                {isDiscovering ? '🔄 Discovering...' : '🔍 Discover'}
              </button>

              {discoveredModels.length > 0 && (
                <>
                  <h4 style={{ marginTop: '2rem' }}>Found {discoveredModels.length} model(s)</h4>
                  <div style={styles.discoveredList}>
                    {discoveredModels.map((model, idx) => (
                      <div key={idx} style={styles.discoveredItem}>
                        <input type="checkbox" checked={selectedDiscoveredModels.has(idx)} onChange={() => toggleDiscoveredModel(idx)} />
                        <div style={{ flex: 1 }}>
                          <strong>{model.name}</strong>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{model.path}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={registerSelectedModels} disabled={isRegistering} style={{ ...styles.btn, ...styles.successBtn, marginTop: '1rem' }}>
                    {isRegistering ? '⏳ Registering...' : '✅ Register Selected'}
                  </button>
                </>
              )}
            </div>
          )}

          {selectedTab === 'finetune' && (
            <div style={styles.finetuneSection}>
              <h3>🎯 Fine-Tuning (Coming Soon)</h3>
              <div style={styles.comingSoon}>
                <p>Fine-tuning functionality will be available in the next release.</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>Features planned:</p>
                <ul style={{ margin: '0.5rem 0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <li>Custom dataset upload</li>
                  <li>Training parameter configuration</li>
                  <li>Progress monitoring</li>
                  <li>Model checkpoint management</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Model Configuration */}
        {selectedModel && selectedTab === 'list' && (
          <div style={styles.rightPanel}>
            <div style={styles.configHeader}>
              <h3>⚙️ {selectedModel.name} Configuration</h3>
              <button style={styles.closeBtn} onClick={() => setSelectedModel(null)}>✕</button>
            </div>
            
            <div style={styles.configContent}>
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
              <button onClick={saveModelConfig} style={styles.saveBtn}>💾 Save Configuration</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getStatusColor = (status) => {
  switch(status) {
    case 'running': return '#28a745';
    case 'stopped': return '#dc3545';
    case 'loading': return '#ffc107';
    default: return '#6c757d';
  }
};

const getStatusText = (status) => {
  switch(status) {
    case 'running': return 'Running';
    case 'stopped': return 'Stopped';
    case 'loading': return 'Loading';
    default: return status || 'Unknown';
  }
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
  bulkActions: {
    display: 'flex',
    gap: '1rem',
  },
  bulkBtn: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  startBtn: {
    backgroundColor: 'var(--color-success)',
    color: 'white',
  },
  stopBtn: {
    backgroundColor: 'var(--color-warning)',
    color: 'white',
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
    transition: 'all 0.2s' 
  },
  tabActive: { 
    color: 'var(--color-primary)', 
    fontWeight: 'bold', 
    borderBottom: '3px solid var(--color-primary)' 
  },
  mainLayout: { 
    display: 'flex', 
    gap: '2rem' 
  },
  leftPanel: { 
    flex: 1 
  },
  rightPanel: { 
    width: '400px', 
    backgroundColor: 'var(--bg-secondary)', 
    border: '1px solid var(--border-color)', 
    borderRadius: '0.75rem', 
    padding: '1.5rem', 
    maxHeight: 'calc(100vh - 200px)', 
    overflowY: 'auto', 
    position: 'sticky', 
    top: '100px' 
  },
  controls: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  },
  filters: {
    display: 'flex',
    gap: '0.5rem',
  },
  filterSelect: {
    padding: '0.75rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  },
  modelsList: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
    gap: '1.5rem' 
  },
  modelCard: { 
    backgroundColor: 'var(--bg-secondary)', 
    border: '1px solid var(--border-color)', 
    borderRadius: '0.75rem', 
    padding: '1.5rem', 
    cursor: 'pointer', 
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  modelCardActive: { 
    backgroundColor: 'var(--color-primary)', 
    color: 'white', 
    border: '2px solid var(--color-primary)' 
  },
  modelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  modelName: {
    margin: '0',
    fontSize: '1.1rem',
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'white',
  },
  modelInfo: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    '& p': {
      margin: '0.25rem 0',
    },
  },
  modelActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  reloadBtn: {
    backgroundColor: 'var(--color-info)',
    color: 'white',
  },
  discoverSection: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
  },
  finetuneSection: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
  },
  comingSoon: {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '0.5rem',
    border: '2px dashed var(--border-color)',
  },
  configHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '1rem', 
    paddingBottom: '1rem', 
    borderBottom: '2px solid var(--border-color)' 
  },
  closeBtn: { 
    cursor: 'pointer', 
    fontSize: '1.5rem', 
    color: 'var(--text-secondary)', 
    transition: 'all 0.2s' 
  },
  configContent: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1rem' 
  },
  configSection: { 
    backgroundColor: 'var(--bg-tertiary)', 
    padding: '1rem', 
    borderRadius: '0.5rem', 
    border: '1px solid var(--border-color)' 
  },
  unsavedWarning: { 
    padding: '0.75rem', 
    backgroundColor: 'rgba(255, 193, 7, 0.1)', 
    border: '1px solid #ffc107', 
    borderRadius: '0.5rem', 
    color: 'var(--text-primary)', 
    fontSize: '0.85rem' 
  },
  saveBtn: { 
    width: '100%', 
    padding: '0.75rem', 
    backgroundColor: 'var(--color-success)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '0.5rem', 
    cursor: 'pointer', 
    fontSize: '0.9rem', 
    fontWeight: 'bold', 
    transition: 'all 0.2s' 
  },
  noModels: { 
    color: 'var(--text-tertiary)', 
    fontStyle: 'italic' 
  },
  formGroup: { 
    marginBottom: '1rem', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.5rem' 
  },
  input: { 
    padding: '0.75rem', 
    border: '1px solid var(--border-color)', 
    borderRadius: '0.5rem', 
    backgroundColor: 'var(--bg-secondary)', 
    color: 'var(--text-primary)' 
  },
  btn: { 
    padding: '0.75rem 1.5rem', 
    backgroundColor: 'var(--color-primary)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '0.5rem', 
    cursor: 'pointer', 
    fontSize: '0.9rem', 
    transition: 'all 0.2s' 
  },
  successBtn: {
    backgroundColor: 'var(--color-success)',
  },
  discoveredList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.75rem', 
    marginTop: '1rem' 
  },
  discoveredItem: { 
    display: 'flex', 
    gap: '1rem', 
    alignItems: 'center', 
    padding: '0.75rem', 
    backgroundColor: 'var(--bg-tertiary)', 
    borderRadius: '0.5rem', 
    border: '1px solid var(--border-color)' 
  },
};

export default ModelsPage;