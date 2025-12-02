// frontend/src/App.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Dashboard component with enhanced features
const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);
  const [chartData, setChartData] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = () => {
      const wsUrl = `ws://${window.location.host}/ws`;
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
      };
      
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'metrics') {
          setMetrics(data.payload);
          
          // Create chart data
          const memoryData = {
            labels: ['Current', 'Peak'],
            datasets: [{
              label: 'Memory Usage (GB)',
              data: [
                parseFloat(data.payload.memory_usage?.current) || 0,
                parseFloat(data.payload.memory_usage?.peak) || 0
              ],
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          };
          
          setChartData(memoryData);
        } else if (data.type === 'models') {
          setModels(data.payload);
        }
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      websocket.onclose = () => {
        console.log('WebSocket closed');
        // Try to reconnect after 5 seconds
        setTimeout(initializeWebSocket, 5000);
      };
      
      wsRef.current = websocket;
      setWs(websocket);
    };

    initializeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fetch initial data if WebSocket fails
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [metricsResponse, modelsResponse] = await Promise.all([
          fetch('/api/v1/monitoring'),
          fetch('/api/v1/models')
        ]);

        const metricsData = await metricsResponse.json();
        const modelsData = await modelsResponse.json();

        setMetrics(metricsData);
        setModels(modelsData.models || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading && !metrics) {
    return <div className={`dashboard ${theme}`}>Loading dashboard...</div>;
  }

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

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Memory Usage'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className={`dashboard ${theme}`}>
      <header className="dashboard-header">
        <h1>Llama Runner Async Proxy Dashboard</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </header>

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

      {chartData && (
        <div className="chart-section">
          <h2>Memory Usage Chart</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      <div className="models-section">
        <h2>Active Models</h2>
        <div className="model-list">
          {models.map((model, index) => (
            <div key={index} className="model-card">
              <h3>{model.name}</h3>
              <p>Port: {model.port}</p>
              <p>Status: <span style={{color: getStatusColor(model.status)}}>{getStatusText(model.status)}</span></p>
              <button className="action-btn" onClick={() => {
                // Handle start/stop action
                console.log('Action for model:', model.name);
              }}>Manage</button>
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
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${(parseFloat(metrics.memory_usage?.current) / parseFloat(metrics.memory_usage?.peak) || 0) * 100}%`}}
                ></div>
              </div>
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

// Advanced Model Configuration component
const ModelConfig = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModels, setFilteredModels] = useState([]);

  useEffect(() => {
    // Fetch available models for configuration
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/v1/models');
        const data = await response.json();
        setModels(data.models || []);
        setFilteredModels(data.models || []);
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchModels();
  }, []);

  // Filter models based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredModels(models);
    } else {
      const filtered = models.filter(model => 
        model.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredModels(filtered);
    }
  }, [searchTerm, models]);

  // Handle model selection
  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setConfig({
      port: model.port || 8081,
      name: model.name,
      temperature: model.temperature || 0.7,
      ctx_size: model.ctx_size || 32000,
      batch_size: model.batch_size || 1024,
      threads: model.threads || 10,
      flash_attn: model.flash_attn || "on",
      mlock: model.mlock || true,
      no_mmap: model.no_mmap || true
    });
  };

  // Save configuration
  const saveConfig = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Handle model start/stop actions
  const handleModelAction = (action, modelName) => {
    console.log(`Performing ${action} action on model: ${modelName}`);
    // In a real implementation this would make API calls to start/stop models
  };

  return (
    <div className={`model-config ${theme}`}>
      <header className="config-header">
        <h1>Model Configuration</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </header>
      
      <div className="models-list">
        <h2>Available Models</h2>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search models..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ul>
          {filteredModels.map((model, index) => (
            <li key={index}>
              <button onClick={() => handleModelSelect(model)} className="model-btn">
                {model.name}
              </button>
              <button 
                className="action-btn" 
                onClick={() => handleModelAction('start', model.name)}
                style={{margin: '0 5px'}}
              >
                Start
              </button>
              <button 
                className="action-btn" 
                onClick={() => handleModelAction('stop', model.name)}
                style={{margin: '0 5px'}}
              >
                Stop
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="model-details">
        <h2>Configuration</h2>
        {selectedModel ? (
          <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }} className="config-form">
            <div className="form-group">
              <label htmlFor="model-name">Model Name:</label>
              <input 
                id="model-name"
                type="text" 
                value={config.name}
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="port">Port:</label>
              <input 
                id="port"
                type="number" 
                value={config.port}
                onChange={(e) => setConfig({...config, port: parseInt(e.target.value)})} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="temperature">Temperature:</label>
              <input 
                id="temperature"
                type="number" 
                min="0.0" 
                max="1.0" 
                step="0.01"
                value={config.temperature}
                onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="ctx_size">Context Size:</label>
              <input 
                id="ctx_size"
                type="number" 
                value={config.ctx_size}
                onChange={(e) => setConfig({...config, ctx_size: parseInt(e.target.value)})} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="batch_size">Batch Size:</label>
              <input 
                id="batch_size"
                type="number" 
                value={config.batch_size}
                onChange={(e) => setConfig({...config, batch_size: parseInt(e.target.value)})} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="threads">Threads:</label>
              <input 
                id="threads"
                type="number" 
                value={config.threads}
                onChange={(e) => setConfig({...config, threads: parseInt(e.target.value)})} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="flash_attn">Flash Attention:</label>
              <select 
                id="flash_attn"
                value={config.flash_attn}
                onChange={(e) => setConfig({...config, flash_attn: e.target.value})} 
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="mlock">Memory Lock:</label>
              <input 
                id="mlock"
                type="checkbox" 
                checked={config.mlock}
                onChange={(e) => setConfig({...config, mlock: e.target.checked})} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="no_mmap">Disable Memory Mapping:</label>
              <input 
                id="no_mmap"
                type="checkbox" 
                checked={config.no_mmap}
                onChange={(e) => setConfig({...config, no_mmap: e.target.checked})} 
              />
            </div>
            
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
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