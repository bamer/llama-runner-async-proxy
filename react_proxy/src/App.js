import React, { useState, useEffect } from 'react';

// Dashboard component
const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch system metrics
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/v1/monitoring');
        const data = await response.json();
        setMetrics(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setLoading(false);
      }
    };

    // Fetch models
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/v1/models');
        const data = await response.json();
        setModels(data.models || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching models:', error);
        setLoading(false);
      }
    };

    fetchMetrics();
    fetchModels();

    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchMetrics();
      fetchModels();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="dashboard">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Llama Runner Async Proxy Dashboard</h1>
      
      {metrics && (
        <div className="metrics-summary">
          <h2>System Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Uptime</h3>
              <p>{metrics.uptime || 'N/A'} seconds</p>
            </div>
            <div className="metric-card">
              <h3>Total Models</h3>
              <p>{metrics.total_models || 0}</p>
            </div>
            <div className="metric-card">
              <h3>Active Runners</h3>
              <p>{metrics.active_runners || 0}</p>
            </div>
            <div className="metric-card">
              <h3>Total Starts</h3>
              <p>{metrics.total_starts || 0}</p>
            </div>
            <div className="metric-card">
              <h3>Total Stops</h3>
              <p>{metrics.total_stops || 0}</p>
            </div>
            <div className="metric-card">
              <h3>Total Errors</h3>
              <p>{metrics.total_errors || 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="models-section">
        <h2>Active Models</h2>
        <div className="model-list">
          {models.map((model, index) => (
            <div key={index} className="model-card">
              <h3>{model.name}</h3>
              <p>Port: {model.port}</p>
              <p>Status: {model.status}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="system-status">
        <h2>System Status</h2>
        {metrics && (
          <>
            <div className="status-card">
              <h3>Memory Usage</h3>
              <p>Current: {metrics.memory_usage?.current || 'N/A'} GB</p>
              <p>Peak: {metrics.memory_usage?.peak || 'N/A'} GB</p>
            </div>
            <div className="status-card">
              <h3>Load Average</h3>
              <p>{metrics.load_average || 'N/A'}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Model Configuration component
const ModelConfig = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [config, setConfig] = useState({});

  useEffect(() => {
    // Fetch available models for configuration
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/v1/models');
        const data = await response.json();
        setModels(data.models || []);
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchModels();
  }, []);

  // Handle model selection
  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setConfig({
      port: model.port || 8081,
      name: model.name
    });
  };

  // Save configuration
  const saveConfig = async () => {
    if (!selectedModel) return;
    
    try {
      const response = await fetch(`/api/v1/config/${selectedModel.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Configuration saved successfully');
      } else {
        alert('Error saving configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Network error saving configuration');
    }
  };

  return (
    <div className="model-config">
      <h1>Model Configuration</h1>
      
      <div className="models-list">
        <h2>Available Models</h2>
        <ul>
          {models.map((model, index) => (
            <li key={index}>
              <button onClick={() => handleModelSelect(model)}>
                {model.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="model-details">
        <h2>Configuration</h2>
        {selectedModel ? (
          <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }}>
            <div className="form-group">
              <label>Port:</label>
              <input 
                type="number" 
                value={config.port}
                onChange={(e) => setConfig({...config, port: parseInt(e.target.value)})} 
              />
            </div>
            <button type="submit">Save Configuration</button>
          </form>
        ) : (
          <p>Select a model to configure</p>
        )}
      </div>
    </div>
  );
};

// Main App component
function App() {
  return (
    <div className="App">
      <Dashboard />
      <ModelConfig />
    </div>
  );
}

export default App;