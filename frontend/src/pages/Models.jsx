import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ModelsPage = () => {
  const [models, setModels] = useState([]);
  const [discoveredModels, setDiscoveredModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelsPath, setModelsPath] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedTab, setSelectedTab] = useState('list');
  const [editingParams, setEditingParams] = useState({});
  const [loadedModel, setLoadedModel] = useState(null);
  const [showFineTune, setShowFineTune] = useState(false);
  const [fineTuneConfig, setFineTuneConfig] = useState({});
  const [configLoading, setConfigLoading] = useState(true);
  const [selectedDiscoveredModels, setSelectedDiscoveredModels] = useState(new Set());
  const configPanelRef = useRef(null);

  useEffect(() => {
    loadModels();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await axios.get('/api/v1/config/defaults');
      if (res.data.paths?.modelsDirectory) {
        setModelsPath(res.data.paths.modelsDirectory);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setConfigLoading(false);
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
      setDiscoveredModels(res.data.models || []);
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

  const toggleAllDiscoveredModels = () => {
    if (selectedDiscoveredModels.size === discoveredModels.length) {
      setSelectedDiscoveredModels(new Set());
    } else {
      setSelectedDiscoveredModels(new Set(discoveredModels.map((_, idx) => idx)));
    }
  };

  const registerSelectedModels = async () => {
    const modelsToRegister = discoveredModels.filter((_, idx) => selectedDiscoveredModels.has(idx));
    if (modelsToRegister.length === 0) {
      alert('No models selected');
      return;
    }

    setIsRegistering(true);
    try {
      const conflicts = modelsToRegister.filter(m => models.some(existing => existing.name === m.name));
      
      if (conflicts.length > 0) {
        const choice = window.confirm(
          `${conflicts.length} model(s) already registered:\n${conflicts.map(c => c.name).join(', ')}\n\nKeep existing settings? (OK=Keep, Cancel=Replace)`
        );
        
        if (choice) {
          const newModels = modelsToRegister.filter(m => !conflicts.some(c => c.name === m.name));
          if (newModels.length > 0) {
            await axios.post('/api/v1/models/register', { models: newModels });
            alert(`${newModels.length} new model(s) registered (${conflicts.length} skipped)`);
          } else {
            alert('No new models to register');
          }
        } else {
          await axios.post('/api/v1/models/register', { models: modelsToRegister });
          alert(`${modelsToRegister.length} model(s) registered (replaced existing settings)`);
        }
      } else {
        await axios.post('/api/v1/models/register', { models: modelsToRegister });
        alert(`${modelsToRegister.length} model(s) registered successfully`);
      }
      
      setDiscoveredModels([]);
      setSelectedDiscoveredModels(new Set());
      loadModels();
      setSelectedTab('list');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const selectModel = (model) => {
    setSelectedModel(model);
    setEditingParams({
      ...model,
      models_dir: model.models_dir || modelsPath || '',
    });
    setTimeout(() => {
      configPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const saveModelConfig = async () => {
    if (!selectedModel) return;

    try {
      await axios.put(`/api/v1/models/${selectedModel.name}`, editingParams);
      alert('Model configuration saved');
      loadModels();
      setSelectedModel(null);
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const deleteModel = async (modelName) => {
    if (!window.confirm(`Delete ${modelName}?`)) return;

    try {
      await axios.delete(`/api/v1/models/${modelName}`);
      alert('Model deleted');
      loadModels();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const startModel = async (modelName) => {
    try {
      await axios.post(`/api/v1/models/${modelName}/start`);
      setLoadedModel(modelName);
      alert(`Started ${modelName}`);
      loadModels();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const stopModel = async (modelName) => {
    try {
      await axios.post(`/api/v1/models/${modelName}/stop`);
      setLoadedModel(null);
      alert(`Stopped ${modelName}`);
      loadModels();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const startFineTuning = (model) => {
    setFineTuneConfig({
      modelName: model.name,
      modelPath: model.path,
      datasetPath: '',
      epochs: 3,
      learning_rate: 0.0001,
      batch_size: 32,
      output_dir: `/tmp/${model.name}_fine_tuned`,
      warmup_steps: 100,
      save_steps: 500,
    });
    setShowFineTune(true);
  };

  const submitFineTuning = async () => {
    if (!fineTuneConfig.datasetPath) {
      alert('Please specify a dataset path');
      return;
    }

    try {
      alert(`Fine-tuning started for ${fineTuneConfig.modelName}:\n- Dataset: ${fineTuneConfig.datasetPath}\n- Epochs: ${fineTuneConfig.epochs}\n- Output: ${fineTuneConfig.output_dir}`);
      setShowFineTune(false);
      setFineTuneConfig({});
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (configLoading) return <div style={styles.loading}>Loading configuration...</div>;

  return (
    <div style={styles.container}>
      <h2>🤖 Model Management</h2>

      <div style={styles.tabs}>
        <button style={{...styles.tabBtn, ...(selectedTab === 'list' ? styles.tabActive : {})}} onClick={() => setSelectedTab('list')}>
          My Models ({models.length})
        </button>
        <button style={{...styles.tabBtn, ...(selectedTab === 'discover' ? styles.tabActive : {})}} onClick={() => setSelectedTab('discover')}>
          Discover Models
        </button>
        <button style={{...styles.tabBtn, ...(selectedTab === 'tuning' ? styles.tabActive : {})}} onClick={() => setSelectedTab('tuning')}>
          Fine-Tune
        </button>
      </div>

      {selectedTab === 'list' && (
        <div style={styles.content}>
          {selectedModel && (
            <div ref={configPanelRef} style={{...styles.configPanel, marginBottom: '2rem'}}>
              <div style={styles.configHeader}>
                <h3>⚙️ Configure: {selectedModel.name}</h3>
                <button style={{...styles.btn, ...styles.btnSecondary, padding: '0.5rem 1rem'}} onClick={() => setSelectedModel(null)}>
                  ✕ Close
                </button>
              </div>
              <div style={styles.configForm}>
                <div style={styles.paramRow}>
                  <ParameterControl label="Models Directory" type="text" value={editingParams.models_dir || ''} onChange={(v) => setEditingParams({...editingParams, models_dir: v})} />
                  <div></div>
                  <div></div>
                </div>

                <div style={styles.paramRow}>
                  <ParameterControl label="Context Size" type="number" min="128" max="2000000" value={editingParams.ctx_size} onChange={(v) => setEditingParams({...editingParams, ctx_size: parseInt(v)})} />
                  <ParameterControl label="Batch Size" type="number" value={editingParams.batch_size} onChange={(v) => setEditingParams({...editingParams, batch_size: parseInt(v)})} />
                  <ParameterControl label="GPU Layers" type="number" min="0" value={editingParams.gpu_layers} onChange={(v) => setEditingParams({...editingParams, gpu_layers: parseInt(v)})} />
                </div>

                <div style={styles.paramRow}>
                  <ParameterControl label="Temperature" type="number" step="0.1" min="0" max="2" value={editingParams.temp} onChange={(v) => setEditingParams({...editingParams, temp: parseFloat(v)})} />
                  <ParameterControl label="Top K" type="number" value={editingParams.top_k} onChange={(v) => setEditingParams({...editingParams, top_k: parseInt(v)})} />
                  <ParameterControl label="Top P" type="number" step="0.01" min="0" max="1" value={editingParams.top_p} onChange={(v) => setEditingParams({...editingParams, top_p: parseFloat(v)})} />
                </div>

                <div style={styles.paramRow}>
                  <ParameterControl label="Repeat Penalty" type="number" step="0.1" value={editingParams.repeat_penalty} onChange={(v) => setEditingParams({...editingParams, repeat_penalty: parseFloat(v)})} />
                  <ParameterControl label="Threads" type="number" min="1" max="512" value={editingParams.threads} onChange={(v) => setEditingParams({...editingParams, threads: parseInt(v)})} />
                  <ParameterControl label="Port" type="number" value={editingParams.port} onChange={(v) => setEditingParams({...editingParams, port: parseInt(v)})} />
                </div>

                <div style={styles.paramRow}>
                  <ParameterControl label="Mirostat (0/1/2)" type="number" min="0" max="2" value={editingParams.mirostat} onChange={(v) => setEditingParams({...editingParams, mirostat: parseInt(v)})} />
                  <div></div>
                  <div></div>
                </div>

                <div style={styles.checkboxRow}>
                  <ParameterControl label="Flash Attention" type="checkbox" checked={editingParams.flash_attn} onChange={(v) => setEditingParams({...editingParams, flash_attn: v})} />
                  <ParameterControl label="Use MMap" type="checkbox" checked={editingParams.use_mmap} onChange={(v) => setEditingParams({...editingParams, use_mmap: v})} />
                  <ParameterControl label="Verbose" type="checkbox" checked={editingParams.verbose} onChange={(v) => setEditingParams({...editingParams, verbose: v})} />
                </div>

                {selectedModel && selectedModel.multimodal && selectedModel.multimodal.length > 0 && (
                  <div style={{...styles.paramRow, borderTop: '2px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem'}}>
                    <div style={{gridColumn: '1 / -1'}}>
                      <h4 style={{marginBottom: '0.5rem'}}>🎥 Multimodal Configuration</h4>
                      <ParameterControl label="Enable Multimodal" type="checkbox" checked={editingParams.multimodal_enabled || false} onChange={(v) => setEditingParams({...editingParams, multimodal_enabled: v})} />
                      {editingParams.multimodal_enabled && selectedModel.multimodal && (
                        <>
                          <div style={{margin: '0.5rem 0'}}>
                            <label>Select mmproj:</label>
                            <select value={editingParams.mmproj_path || ''} onChange={(e) => setEditingParams({...editingParams, mmproj_path: e.target.value})} style={styles.input}>
                              <option value="">Choose a projection...</option>
                              {selectedModel.multimodal.map((m, idx) => (
                                <option key={idx} value={m.path}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                          <div style={styles.checkboxRow}>
                            <ParameterControl label="Enable Vision" type="checkbox" checked={editingParams.enable_vision || false} onChange={(v) => setEditingParams({...editingParams, enable_vision: v})} />
                            <ParameterControl label="Enable Audio" type="checkbox" checked={editingParams.enable_audio || false} onChange={(v) => setEditingParams({...editingParams, enable_audio: v})} />
                          </div>
                          <div style={styles.paramRow}>
                            <ParameterControl label="Image Batch Size" type="number" value={editingParams.image_batch_size || 512} onChange={(v) => setEditingParams({...editingParams, image_batch_size: parseInt(v)})} />
                            <ParameterControl label="Audio Batch Size" type="number" value={editingParams.audio_batch_size || 512} onChange={(v) => setEditingParams({...editingParams, audio_batch_size: parseInt(v)})} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div style={styles.buttonGroup}>
                  <button style={{...styles.btn, ...styles.btnPrimary}} onClick={saveModelConfig}>💾 Save</button>
                  <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setSelectedModel(null)}>✕ Cancel</button>
                </div>
              </div>
            </div>
          )}

          {models.length === 0 ? (
            <p>No models registered. Go to "Discover Models" tab.</p>
          ) : (
            <div style={styles.modelsList}>
              {models.map((model) => (
                <div key={model.name} style={styles.modelCard}>
                  <div style={styles.modelHeader}>
                    <h4>{model.name}</h4>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      {model.multimodal && model.multimodal.length > 0 && <span style={{...styles.badge, backgroundColor: '#06b6d4'}}>🎥 Multimodal</span>}
                      <span style={{...styles.badge, backgroundColor: loadedModel === model.name ? 'var(--color-success)' : 'var(--bg-tertiary)'}}>
                        {loadedModel === model.name ? '🟢 Running' : 'Ready'}
                      </span>
                    </div>
                  </div>
                  <div style={styles.modelInfo}>
                    <p>📁 {model.filename}</p>
                    <p>💾 {model.sizeGB} GB</p>
                    <p>⚙️ Port: {model.port}</p>
                    <p>GPU Layers: {model.gpu_layers}</p>
                    <p>Context: {model.ctx_size} | Threads: {model.threads}</p>
                  </div>
                  <div style={styles.actions}>
                    <button style={{...styles.btn, ...styles.btnPrimary}} onClick={() => selectModel(model)}>⚙️ Config</button>
                    {loadedModel !== model.name ? (
                      <button style={{...styles.btn, ...styles.btnSuccess}} onClick={() => startModel(model.name)}>▶️ Load</button>
                    ) : (
                      <button style={{...styles.btn, ...styles.btnWarning}} onClick={() => stopModel(model.name)}>⏹️ Unload</button>
                    )}
                    <button style={{...styles.btn, ...styles.btnInfo}} onClick={() => startFineTuning(model)}>📚 Fine-Tune</button>
                    <button style={{...styles.btn, ...styles.btnDanger}} onClick={() => deleteModel(model.name)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'discover' && (
        <div style={styles.content}>
          <h3>🔍 Discover Models from Filesystem</h3>
          <div style={styles.discoverForm}>
            <div style={styles.formGroup}>
              <label>Models Directory:</label>
              <input type="text" value={modelsPath} onChange={(e) => setModelsPath(e.target.value)} placeholder="e.g., /media/bamer/crucial MX300/llm/llama/models" style={styles.input} />
              <small style={styles.help}>Recursively scans for .gguf, .bin, .safetensors files</small>
            </div>
            <button onClick={discoverModels} disabled={isDiscovering} style={{...styles.btn, ...styles.btnPrimary, marginTop: '0.5rem'}}>
              {isDiscovering ? '🔍 Scanning...' : '🔍 Scan Directory'}
            </button>
          </div>

          {discoveredModels.length > 0 && (
            <div style={styles.discoveredList}>
              <div style={styles.discoveredHeader}>
                <h3>✅ Found {discoveredModels.length} Model(s)</h3>
                <label style={{marginRight: '1rem'}}>
                  <input type="checkbox" checked={selectedDiscoveredModels.size === discoveredModels.length} onChange={toggleAllDiscoveredModels} style={{marginRight: '0.5rem'}} />
                  Select All ({selectedDiscoveredModels.size}/{discoveredModels.length})
                </label>
              </div>
              <div style={styles.discoveredGrid}>
                {discoveredModels.map((model, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.discoveredCard,
                      opacity: selectedDiscoveredModels.has(idx) ? 1 : 0.6,
                      borderWidth: selectedDiscoveredModels.has(idx) ? '2px' : '1px',
                      borderColor: selectedDiscoveredModels.has(idx) ? 'var(--color-primary)' : 'var(--border-color)',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleDiscoveredModel(idx)}
                  >
                    <div style={{display: 'flex', gap: '0.5rem', alignItems: 'start'}}>
                      <input type="checkbox" checked={selectedDiscoveredModels.has(idx)} onChange={() => toggleDiscoveredModel(idx)} onClick={(e) => e.stopPropagation()} style={{marginTop: '0.25rem', width: '1rem', height: '1rem', cursor: 'pointer'}} />
                      <div>
                        <p><strong>{model.name}</strong></p>
                        <p>📁 {model.filename}</p>
                        <p>💾 {model.sizeGB} GB</p>
                        <p>Format: {model.format}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <button onClick={registerSelectedModels} disabled={isRegistering || selectedDiscoveredModels.size === 0} style={{...styles.btn, ...styles.btnSuccess, flex: 1}}>
                  {isRegistering ? '⏳ Registering...' : `✅ Register Selected (${selectedDiscoveredModels.size})`}
                </button>
                <button disabled={isRegistering || discoveredModels.length === 0} style={{...styles.btn, ...styles.btnPrimary, flex: 1}} onClick={() => { setSelectedDiscoveredModels(new Set(discoveredModels.map((_, idx) => idx))); setTimeout(() => registerSelectedModels(), 100); }}>
                  {isRegistering ? '⏳ Registering...' : '✅ Register All'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'tuning' && (
        <div style={styles.content}>
          <h3>📚 Fine-Tune Models</h3>
          <p style={styles.help}>Fine-tune models without loading them. Configure parameters for training.</p>
          
          {showFineTune ? (
            <div style={styles.fineTunePanel}>
              <h4>⚙️ Fine-Tuning: {fineTuneConfig.modelName}</h4>
              <div style={styles.configForm}>
                <div style={styles.paramRow}>
                  <ParameterControl label="Dataset Path" type="text" value={fineTuneConfig.datasetPath} onChange={(v) => setFineTuneConfig({...fineTuneConfig, datasetPath: v})} />
                  <div></div>
                  <div></div>
                </div>

                <div style={styles.paramRow}>
                  <ParameterControl label="Epochs" type="number" value={fineTuneConfig.epochs} onChange={(v) => setFineTuneConfig({...fineTuneConfig, epochs: parseInt(v)})} />
                  <ParameterControl label="Learning Rate" type="number" step="0.00001" value={fineTuneConfig.learning_rate} onChange={(v) => setFineTuneConfig({...fineTuneConfig, learning_rate: parseFloat(v)})} />
                  <ParameterControl label="Batch Size" type="number" value={fineTuneConfig.batch_size} onChange={(v) => setFineTuneConfig({...fineTuneConfig, batch_size: parseInt(v)})} />
                </div>

                <div style={styles.paramRow}>
                  <ParameterControl label="Output Directory" type="text" value={fineTuneConfig.output_dir} onChange={(v) => setFineTuneConfig({...fineTuneConfig, output_dir: v})} />
                  <ParameterControl label="Warmup Steps" type="number" value={fineTuneConfig.warmup_steps} onChange={(v) => setFineTuneConfig({...fineTuneConfig, warmup_steps: parseInt(v)})} />
                  <ParameterControl label="Save Steps" type="number" value={fineTuneConfig.save_steps} onChange={(v) => setFineTuneConfig({...fineTuneConfig, save_steps: parseInt(v)})} />
                </div>

                <div style={{...styles.paramRow, padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '0.5rem', marginTop: '1rem'}}>
                  <div style={{gridColumn: '1 / -1', fontSize: '0.875rem'}}>
                    <p><strong>Model:</strong> {fineTuneConfig.modelName}</p>
                    <p><strong>Path:</strong> {fineTuneConfig.modelPath}</p>
                  </div>
                </div>

                <div style={styles.buttonGroup}>
                  <button style={{...styles.btn, ...styles.btnSuccess}} onClick={submitFineTuning}>🚀 Start Fine-Tuning</button>
                  <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setShowFineTune(false)}>✕ Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.empty}>
              <p>💡 Select a model from "My Models" tab and click "Fine-Tune" to start</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ParameterControl = ({ label, type, value, onChange, min, max, step, checked }) => (
  <div style={styles.paramControl}>
    <label>{label}</label>
    {type === 'checkbox' ? (
      <input type="checkbox" checked={checked || false} onChange={(e) => onChange(e.target.checked)} style={styles.checkbox} />
    ) : (
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} min={min} max={max} step={step} style={styles.input} />
    )}
  </div>
);

const styles = {
  container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto' },
  loading: { padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' },
  tabs: { display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' },
  tabBtn: { padding: '0.75rem 1.5rem', backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' },
  tabActive: { borderBottom: '2px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: '600' },
  content: { marginTop: '2rem' },
  modelsList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  modelCard: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  modelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' },
  badge: { padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' },
  modelInfo: { fontSize: '0.875rem', color: 'var(--text-secondary)' },
  actions: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  btn: { padding: '0.5rem 0.75rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500', whiteSpace: 'nowrap', flex: '1', minWidth: '70px' },
  btnPrimary: { backgroundColor: 'var(--color-primary)', color: 'white' },
  btnSuccess: { backgroundColor: 'var(--color-success)', color: 'white' },
  btnWarning: { backgroundColor: 'var(--color-warning)', color: 'white' },
  btnInfo: { backgroundColor: '#06b6d4', color: 'white' },
  btnDanger: { backgroundColor: 'var(--color-danger)', color: 'white' },
  btnSecondary: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' },
  configPanel: { backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--color-primary)', borderRadius: '0.75rem', padding: '2rem', position: 'relative', zIndex: 10 },
  configHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  configForm: { display: 'grid', gap: '1rem', marginTop: '1rem' },
  paramRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' },
  checkboxRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' },
  paramControl: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  input: { padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' },
  checkbox: { width: '1.25rem', height: '1.25rem', cursor: 'pointer' },
  buttonGroup: { gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' },
  discoverForm: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem' },
  formGroup: { marginBottom: '1rem' },
  help: { display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' },
  discoveredList: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem' },
  discoveredHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' },
  discoveredGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' },
  discoveredCard: { backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem', border: '1px solid var(--border-color)', transition: 'all 0.2s' },
  fineTunePanel: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem' },
  empty: { color: 'var(--text-tertiary)', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' },
};

export default ModelsPage;
