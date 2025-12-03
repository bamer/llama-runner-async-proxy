import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper component for parameter input
const ParameterControl = ({ label, type, value, onChange, min, max, step, checked, options = [] }) => {
  if (type === 'checkbox') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
        <input type="checkbox" checked={checked || false} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
    );
  }
  if (type === 'select') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>{label}</label>
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #bdbdbd', borderRadius: '4px' }}>
          <option value="">--Select--</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>{label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} style={{ padding: '0.5rem', border: '1px solid #bdbdbd', borderRadius: '4px' }} min={min} max={max} step={step} />
    </div>
  );
};

const ModelsPage = () => {
  const [models, setModels] = useState([]);
  const [discoveredModels, setDiscoveredModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelsPath, setModelsPath] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedTab, setSelectedTab] = useState('list');
  const [editingParams, setEditingParams] = useState({});
  const [selectedDiscoveredModels, setSelectedDiscoveredModels] = useState(new Set());
  const [isLoadingModel, setIsLoadingModel] = useState({});
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load models and config on mount
  useEffect(() => {
    loadModels();
    loadConfig();
  }, []);

  // Load model details when selected
  useEffect(() => {
    if (selectedModel) {
      loadModelDetails(selectedModel.name);
      setHasUnsavedChanges(false);
    }
  }, [selectedModel]);

  // Auto-save with debouncing (3 seconds)
  useEffect(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    
    if (hasUnsavedChanges && selectedModel && Object.keys(editingParams).length > 0) {
      const timer = setTimeout(() => {
        saveModelConfig();
      }, 3000);
      setAutoSaveTimer(timer);
    }
    
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [editingParams, hasUnsavedChanges, selectedModel]);

  const loadConfig = async () => {
    try {
      const res = await axios.get('/api/v1/config/defaults');
      if (res.data.paths?.modelsDirectory) {
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
      setEditingParams(res.data.config || {});
    } catch (error) {
      console.error('Error loading model details:', error);
    }
  };

  const discoverModels = async () => {
    if (!modelsPath) {
      alert('Please enter a path');
      return;
    }

    setIsDiscovering(true);
    try {
      const res = await axios.post('/api/v1/models/discover', {
        path: modelsPath,
        maxDepth: 3,
      });
      setDiscoveredModels((res.data.models || []).map(m => ({
        ...m,
        models_dir: modelsPath
      })));
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
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedDiscoveredModels(newSelected);
  };

  const registerSelectedModels = async () => {
    const modelsToRegister = discoveredModels
      .filter((_, idx) => selectedDiscoveredModels.has(idx))
      .map(m => ({ ...m, models_dir: modelsPath }));
    
    if (modelsToRegister.length === 0) {
      alert('No models selected');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await axios.post('/api/v1/models/register', {
        models: modelsToRegister,
      });
      alert(`Registered ${res.data.registered} model(s)`);
      loadModels();
      setSelectedDiscoveredModels(new Set());
    } catch (error) {
      alert(`Error registering models: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const startModel = async (model) => {
    setIsLoadingModel(prev => ({ ...prev, [model.name]: true }));
    try {
      await axios.post(`/api/v1/models/${model.name}/start`);
      loadModels();
    } catch (error) {
      console.error('Error starting model:', error);
    } finally {
      setIsLoadingModel(prev => ({ ...prev, [model.name]: false }));
    }
  };

  const stopModel = async (model) => {
    try {
      await axios.post(`/api/v1/models/${model.name}/stop`);
      loadModels();
    } catch (error) {
      console.error('Error stopping model:', error);
    }
  };

  const saveModelConfig = async () => {
    if (!selectedModel) return;
    
    try {
      await axios.put(`/api/v1/models/${selectedModel.name}`, editingParams);
      setModels(prev => prev.map(m => m.name === selectedModel.name ? { ...m, ...editingParams } : m));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const deleteModel = async (model) => {
    if (!confirm(`Delete model ${model.name}?`)) return;
    
    try {
      await axios.delete(`/api/v1/models/${model.name}`);
      loadModels();
      setSelectedModel(null);
    } catch (error) {
      console.error('Error deleting model:', error);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      height: 'calc(100vh - 100px)',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: '#f5f5f5',
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    tabs: {
      display: 'flex',
      gap: '0.5rem',
      borderBottom: '2px solid #e0e0e0',
    },
    tabBtn: {
      padding: '0.75rem 1.25rem',
      backgroundColor: '#e0e0e0',
      border: 'none',
      borderRadius: '4px 4px 0 0',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    tabActive: {
      backgroundColor: '#1976d2',
      color: '#fff',
    },
    content: {
      flex: 1,
      padding: '1.5rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      overflow: 'auto',
    },
    modelsList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '1rem',
    },
    modelCard: {
      padding: '1.5rem',
      backgroundColor: '#f8f8f8',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center',
    },
    modelCardActive: {
      backgroundColor: '#1976d2',
      color: '#fff',
      borderColor: '#1976d2',
    },
    sidebar: {
      width: '320px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    sidebarHeader: {
      padding: '1rem',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sidebarContent: {
      flex: 1,
      padding: '1rem',
      overflow: 'auto',
    },
    sidebarFooter: {
      padding: '1rem',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      gap: '0.5rem',
      flexDirection: 'column',
    },
    btn: {
      padding: '0.6rem 1rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.9rem',
      transition: 'all 0.2s ease',
    },
    btnPrimary: {
      backgroundColor: '#1976d2',
      color: '#fff',
    },
    btnSecondary: {
      backgroundColor: '#e0e0e0',
      color: '#212121',
    },
    btnSuccess: {
      backgroundColor: '#4caf50',
      color: '#fff',
    },
    btnDanger: {
      backgroundColor: '#f44336',
      color: '#fff',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <h2 style={{ margin: '0' }}>🤖 Model Management</h2>

        <div style={styles.tabs}>
          {['list', 'discover'].map(tab => (
            <button
              key={tab}
              style={{ ...styles.tabBtn, ...(selectedTab === tab ? styles.tabActive : {}) }}
              onClick={() => setSelectedTab(tab)}
            >
              {tab === 'list' ? `My Models (${models.length})` : 'Discover Models'}
            </button>
          ))}
        </div>

        {selectedTab === 'list' && (
          <div style={styles.content}>
            {models.length === 0 ? (
              <p>No models registered. Go to "Discover Models" tab.</p>
            ) : (
              <div style={styles.modelsList}>
                {models.map(model => (
                  <div
                    key={model.name}
                    style={{
                      ...styles.modelCard,
                      ...(selectedModel?.name === model.name ? styles.modelCardActive : {}),
                    }}
                    onClick={() => setSelectedModel(model)}
                  >
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', wordBreak: 'break-word' }}>{model.name}</h3>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', opacity: 0.8 }}>
                      {model.format || 'Unknown'} • {model.sizeGB ? `${model.sizeGB.toFixed(1)}GB` : 'Unknown size'}
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', fontWeight: '500' }}>
                      Status: <span style={{ fontWeight: '600', color: model.status === 'running' ? '#4caf50' : '#999' }}>{model.status}</span>
                    </p>
                    {model.port && (
                      <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', opacity: 0.7 }}>
                        Port: {model.port}
                      </p>
                    )}
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      {model.status === 'running' ? (
                        <button
                          style={{ ...styles.btn, ...styles.btnSecondary, flex: 1 }}
                          onClick={(e) => { e.stopPropagation(); stopModel(model); }}
                        >
                          ⏹️ Stop
                        </button>
                      ) : (
                        <button
                          style={{ ...styles.btn, ...styles.btnSuccess, flex: 1 }}
                          onClick={(e) => { e.stopPropagation(); startModel(model); }}
                          disabled={isLoadingModel[model.name]}
                        >
                          {isLoadingModel[model.name] ? '⏳ Loading...' : '▶️ Start'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'discover' && (
          <div style={styles.content}>
            <h3>🔍 Discover Models</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={modelsPath}
                onChange={(e) => setModelsPath(e.target.value)}
                placeholder="Directory path (e.g., /models, ~/llama-models)"
                style={{ ...styles.btn, flex: 1, backgroundColor: '#fff', border: '1px solid #bdbdbd', color: '#000', padding: '0.6rem' }}
              />
              <button
                style={{ ...styles.btn, ...styles.btnSuccess }}
                onClick={discoverModels}
                disabled={isDiscovering}
              >
                {isDiscovering ? 'Searching...' : '🔍 Discover'}
              </button>
            </div>

            {discoveredModels.length > 0 && (
              <div>
                <button
                  style={{ ...styles.btn, ...styles.btnSecondary, marginBottom: '1rem' }}
                  onClick={() => {
                    if (selectedDiscoveredModels.size === discoveredModels.length) {
                      setSelectedDiscoveredModels(new Set());
                    } else {
                      setSelectedDiscoveredModels(new Set(discoveredModels.map((_, i) => i)));
                    }
                  }}
                >
                  {selectedDiscoveredModels.size === discoveredModels.length ? 'Deselect All' : 'Select All'}
                </button>
                
                <div style={styles.modelsList}>
                  {discoveredModels.map((model, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.modelCard,
                        backgroundColor: selectedDiscoveredModels.has(idx) ? '#4caf50' : '#f8f8f8',
                        color: selectedDiscoveredModels.has(idx) ? '#fff' : '#212121',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleDiscoveredModel(idx)}
                    >
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', wordBreak: 'break-word' }}>{model.name}</h3>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', opacity: 0.8 }}>
                        {model.format} • {model.sizeGB?.toFixed(1)}GB
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  style={{ ...styles.btn, ...styles.btnPrimary, marginTop: '1rem', width: '100%' }}
                  onClick={registerSelectedModels}
                  disabled={isRegistering || selectedDiscoveredModels.size === 0}
                >
                  {isRegistering ? 'Registering...' : `Register Selected Models (${selectedDiscoveredModels.size})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedModel && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={{ margin: '0' }}>⚙️ Configure</h3>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary, padding: '0.4rem 0.8rem' }}
              onClick={() => setSelectedModel(null)}
            >
              ✕
            </button>
          </div>
          
          <div style={styles.sidebarContent}>
            <h4 style={{ margin: '0 0 1rem 0', wordBreak: 'break-all', fontSize: '0.95rem' }}>{selectedModel.name}</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <ParameterControl label="Port" type="number" value={editingParams.port} onChange={(v) => { setEditingParams({ ...editingParams, port: v }); setHasUnsavedChanges(true); }} />
              <ParameterControl label="Context Size" type="number" value={editingParams.ctx_size} onChange={(v) => { setEditingParams({ ...editingParams, ctx_size: v }); setHasUnsavedChanges(true); }} />
              <ParameterControl label="Batch Size" type="number" value={editingParams.batch_size} onChange={(v) => { setEditingParams({ ...editingParams, batch_size: v }); setHasUnsavedChanges(true); }} />
              <ParameterControl label="GPU Layers" type="number" value={editingParams.gpu_layers} onChange={(v) => { setEditingParams({ ...editingParams, gpu_layers: v }); setHasUnsavedChanges(true); }} />
              <ParameterControl label="Temperature" type="number" min="0" max="2" step="0.1" value={editingParams.temperature} onChange={(v) => { setEditingParams({ ...editingParams, temperature: v }); setHasUnsavedChanges(true); }} />
              <ParameterControl label="Top K" type="number" value={editingParams.top_k} onChange={(v) => { setEditingParams({ ...editingParams, top_k: v }); setHasUnsavedChanges(true); }} />
              <ParameterControl label="Top P" type="number" min="0" max="1" step="0.05" value={editingParams.top_p} onChange={(v) => { setEditingParams({ ...editingParams, top_p: v }); setHasUnsavedChanges(true); }} />
              <ParameterControl label="Flash Attention" type="checkbox" checked={editingParams.flash_attn} onChange={(v) => { setEditingParams({ ...editingParams, flash_attn: v }); setHasUnsavedChanges(true); }} />
            </div>
          </div>

          <div style={styles.sidebarFooter}>
            {hasUnsavedChanges && <p style={{ margin: '0', fontSize: '0.8rem', color: '#ff9800' }}>💾 Auto-saving in 3s...</p>}
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={saveModelConfig}
            >
              💾 Save Now
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnDanger }}
              onClick={() => deleteModel(selectedModel)}
            >
              🗑️ Delete Model
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelsPage;
