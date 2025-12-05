import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import io from 'socket.io-client';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const DashboardAndMonitoring = () => {
  // State for system metrics and models
  const [metrics, setMetrics] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [systemHistory, setSystemHistory] = useState([]);
  const [runningModels, setRunningModels] = useState({});
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [modelHistory, setModelHistory] = useState([]);
  const [errorMessages, setErrorMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const MAX_HISTORY = 120;
  const CHART_DISPLAY_POINTS = 60;

  // Initialize WebSocket connection for monitoring data
  useEffect(() => {
    const initializeWebSocket = () => {
      // Try Socket.IO first (for monitoring data)
      const newSocket = io(window.location.origin);
      newSocket.on('connect', () => {
        setConnected(true);
      });
      newSocket.on('disconnect', () => {
        setConnected(false);
      });
      newSocket.on('metrics:update', (data) => {
        setMetrics(data);
        setSystemHistory(prev => [...prev.slice(-MAX_HISTORY + 1), data]);
      });
      newSocket.on('llama-metrics:update', (data) => {
        const { modelName, metrics, history } = data;
        setRunningModels(prev => ({ ...prev, [modelName]: { ...metrics, lastUpdate: new Date() } }));
        if (selectedModel === modelName) {
          setModelMetrics(metrics);
          setModelHistory(history || []);
        }
      });
      newSocket.on('model:status', (data) => {
        const { modelName, status } = data;
        if (status === 'stopped') {
          setRunningModels(prev => {
            const updated = { ...prev };
            delete updated[modelName];
            return updated;
          });
          if (selectedModel === modelName) {
            setSelectedModel(null);
            setModelMetrics(null);
            setModelHistory([]);
          }
        }
      });
      setSocket(newSocket);

      // Also try WebSocket for basic metrics
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
          setModels(data.payload || []);
        }
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setErrorMessages(prev => [...prev, `WebSocket error: ${error.message}`]);
      };
      
      websocket.onclose = () => {
        console.log('WebSocket closed');
        setTimeout(initializeWebSocket, 5000);
      };
      
      wsRef.current = websocket;
    };

    initializeWebSocket();

    return () => {
      if (socket) socket.disconnect();
      if (wsRef.current) wsRef.current.close();
    };
  }, [selectedModel, socket]);

  // Fetch initial data if WebSocket fails
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [metricsResponse, modelsResponse] = await Promise.all([
          axios.get('/api/v1/monitoring'),
          axios.get('/api/v1/models')
        ]);

        const metricsData = metricsResponse.data;
        const modelsData = modelsResponse.data;

        setMetrics(metricsData);
        setModels(modelsData.models || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setErrorMessages(prev => [...prev, `Error fetching initial data: ${error.message}`]);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Chart generation effects
  useEffect(() => {
    if (!systemHistory || systemHistory.length === 0) return;
    const displayData = systemHistory.slice(-CHART_DISPLAY_POINTS);
    const labels = displayData.map((_, i) => i + 's');
    
    setChartData({
      labels,
      datasets: [{
        label: 'Memory Usage (GB)',
        data: displayData.map(m => (m.memory?.used || 0) / 1024 / 1024 / 1024),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      }],
    });
  }, [systemHistory]);

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

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: true, position: 'top' } 
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: 'var(--text-secondary)' } },
      x: { ticks: { color: 'var(--text-secondary)' } },
    },
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Clear error messages
  const clearErrors = () => {
    setErrorMessages([]);
  };

  // Quick action handlers
  const handleStartAll = async () => {
    try {
      await axios.post('/api/v1/models/start-all');
      // Refresh models list
      const response = await axios.get('/api/v1/models');
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Error starting all models:', error);
      setErrorMessages(prev => [...prev, `Error starting all models: ${error.message}`]);
    }
  };

  const handleStopAll = async () => {
    try {
      await axios.post('/api/v1/models/stop-all');
      // Refresh models list
      const response = await axios.get('/api/v1/models');
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Error stopping all models:', error);
      setErrorMessages(prev => [...prev, `Error stopping all models: ${error.message}`]);
    }
  };

  const handleModelAction = async (action, modelName) => {
    try {
      await axios.post(`/api/v1/models/${modelName}/${action}`);
      // Refresh models list
      const response = await axios.get('/api/v1/models');
      setModels(response.data.models || []);
    } catch (error) {
      console.error(`Error ${action}ing model ${modelName}:`, error);
      setErrorMessages(prev => [...prev, `Error ${action}ing model ${modelName}: ${error.message}`]);
    }
  };

  if (loading && !metrics) {
    return <div className={`dashboard ${theme}`}>Loading dashboard...</div>;
  }

  const getGpuInfo = () => {
    if (!metrics?.gpu) return null;
    if (metrics.gpu.devices && metrics.gpu.devices[0]) {
      return metrics.gpu.devices[0];
    }
    return null;
  };

  const gpuInfo = getGpuInfo();
  const gpuUtilization = gpuInfo?.utilization_gpu || metrics?.gpu?.total_utilization || 0;
  const gpuMemoryUsed = gpuInfo?.memory_used || metrics?.gpu?.total_memory_used || 0;
  const gpuMemoryTotal = gpuInfo?.memory_total || metrics?.gpu?.total_memory || 8192;
  const gpuTemp = gpuInfo?.average_temperature || 0;
  const gpuPower = gpuInfo?.power_draw || 0;

  return (
    <div className={`dashboard ${theme}`}>
      <header className="dashboard-header">
        <h1>Llama Runner Async Proxy Dashboard & Monitoring</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </header>

      {/* Error Messages */}
      {errorMessages.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h2>Errors</h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {errorMessages.map((msg, idx) => (
              <div key={idx} style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                color: '#ef4444'
              }}>
                <span>⚠️ {msg}</span>
              </div>
            ))}
          </div>
          <button onClick={clearErrors} style={{
            marginLeft: '1rem',
            backgroundColor: 'var(--color-danger)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>Clear Errors</button>
        </div>
      )}

      {/* System Metrics */}
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

      {/* Memory Usage Chart */}
      {chartData && (
        <div className="chart-section">
          <h2>Memory Usage Chart</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <button onClick={handleStartAll} className="action-btn start-btn">
          ▶️ Start All Models
        </button>
        <button onClick={handleStopAll} className="action-btn stop-btn">
          ⏹️ Stop All Models
        </button>
      </div>

      {/* System Status */}
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

      {/* GPU Metrics */}
      {gpuInfo && (
        <div className="gpu-metrics">
          <h2>GPU Metrics</h2>
          <div className="gpu-stats-grid">
            <div className="gpu-stat-card">
              <div className="gpu-stat-label">GPU Utilization</div>
              <div className="gpu-stat-value">{gpuUtilization.toFixed(1)}%</div>
            </div>
            <div className="gpu-stat-card">
              <div className="gpu-stat-label">Temperature</div>
              <div className="gpu-stat-value">{gpuTemp.toFixed(1)}°C</div>
            </div>
            <div className="gpu-stat-card">
              <div className="gpu-stat-label">Power Draw</div>
              <div className="gpu-stat-value">{gpuPower.toFixed(1)}W</div>
            </div>
            <div className="gpu-stat-card">
              <div className="gpu-stat-label">Memory Usage</div>
              <div className="gpu-stat-value">{(gpuMemoryUsed / 1024).toFixed(1)}GB / {(gpuMemoryTotal / 1024).toFixed(1)}GB</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Models Summary */}
      <div className="models-section">
        <h2>Active Models</h2>
        <div className="model-list">
          {models.map((model) => (
            <div key={model.name} className="model-card">
              <h3>{model.name}</h3>
              <p>Port: {model.port}</p>
              <p>Status: <span style={{color: getStatusColor(model.status)}}>{getStatusText(model.status)}</span></p>
              <div className="model-actions">
                {model.status === 'running' ? (
                  <button 
                    onClick={() => handleModelAction('stop', model.name)}
                    className="action-btn stop-btn"
                  >
                    ⏹️ Stop
                  </button>
                ) : (
                  <button 
                    onClick={() => handleModelAction('start', model.name)}
                    className="action-btn start-btn"
                  >
                    ▶️ Start
                  </button>
                )}
                <button 
                  onClick={() => handleModelAction('reload', model.name)}
                  className="action-btn reload-btn"
                >
                  🔄 Reload
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Model Details */}
      {selectedModel && modelMetrics && (
        <div className="model-details">
          <h2>Model Details: {selectedModel}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Tokens Generated</div>
              <div className="stat-value">{modelMetrics.llama?.tokensGenerated || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Speed</div>
              <div className="stat-value">
                {modelHistory.length >= 2 ? 
                  (modelHistory[modelHistory.length - 1].llama?.tokensGenerated - modelHistory[modelHistory.length - 2].llama?.tokensGenerated).toFixed(1) : 
                  '0'} tok/s
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Context Usage</div>
              <div className="stat-value">{modelMetrics.llama?.contextUsedPercent || 0}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAndMonitoring;