// Main App component - Pure JavaScript without React hooks
const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Llama Runner Async Proxy Dashboard</h1>
      
      <div className="metrics-summary">
        <h2>System Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Uptime</h3>
            <p>45 seconds</p>
          </div>
          <div className="metric-card">
            <h3>Total Models</h3>
            <p>12</p>
          </div>
          <div className="metric-card">
            <h3>Active Runners</h3>
            <p>3</p>
          </div>
          <div className="metric-card">
            <h3>Total Starts</h3>
            <p>15</p>
          </div>
          <div className="metric-card">
            <h3>Total Stops</h3>
            <p>2</p>
          </div>
          <div className="metric-card">
            <h3>Total Errors</h3>
            <p>0</p>
          </div>
        </div>
      </div>
      
      <div className="models-section">
        <h2>Active Models</h2>
        <div className="model-list">
          <div className="model-card">
            <h3>Qwen2.5-Coder-7B-Instruct</h3>
            <p>Port: 8081</p>
            <p>Status: Active</p>
          </div>
          <div className="model-card">
            <h3>Qwen3-Coder-30B-A3B-Instruct</h3>
            <p>Port: 8082</p>
            <p>Status: Active</p>
          </div>
        </div>
      </div>
      
      <div className="system-status">
        <h2>System Status</h2>
        <div className="status-card">
          <h3>Memory Usage</h3>
          <p>Current: 2.4 GB</p>
          <p>Peak: 6.7 GB</p>
        </div>
        <div className="status-card">
          <h3>Load Average</h3>
          <p>0.85</p>
        </div>
      </div>
    </div>
  );
};

// Model Configuration component
const ModelConfig = () => {
  return (
    <div className="model-config">
      <h1>Model Configuration</h1>
      
      <div className="models-list">
        <h2>Available Models</h2>
        <ul>
          <li><button>Qwen2.5-Coder-7B-Instruct</button></li>
          <li><button>Qwen3-Coder-30B-A3B-Instruct</button></li>
        </ul>
      </div>
      
      <div className="model-details">
        <h2>Configuration</h2>
        <form>
          <div className="form-group">
            <label>Port:</label>
            <input type="number" value="8081" />
          </div>
          <button type="submit">Save Configuration</button>
        </form>
      </div>
    </div>
  );
};

// Main App component
function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;