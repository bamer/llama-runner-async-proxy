const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load configuration
const appConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'app_config.json'), 'utf8'));
const modelsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'models_config.json'), 'utf8'));

const app = express();
const PORT = appConfig.webui.port || 8081;

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize service manager (placeholder for now)
let manager = null;

// Routes
const monitoringRoutes = require('./routes/monitoring');
const modelRoutes = require('./routes/models');
const configRoutes = require('./routes/config');
const statusRoutes = require('./routes/status');
const healthRoutes = require('./routes/health');
const websocketRoutes = require('./routes/websocket');

// Register routes
app.use('/api/v1', monitoringRoutes);
app.use('/api/v1', modelRoutes);
app.use('/api/v1', configRoutes);
app.use('/api/v1', statusRoutes);
app.use('/api/v1', healthRoutes);
app.use('/api/v1', websocketRoutes);

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Default route to serve the dashboard
app.get('/', (req, res) => {
    // In a real implementation, this would serve the frontend built bundle
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Llama Runner Async Proxy Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .App {
            max-width: 1200px;
            margin: auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .dashboard {
            margin-bottom: 20px;
        }
        .model-config {
            margin-bottom: 20px;
        }
        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background-color: #0056b3;
        }
        .selected {
            background-color: #28a745;
        }
        .metrics-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .metric-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            width: 150px;
        }
        .model-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .model-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            width: 200px;
        }
        .status-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            width: 200px;
        }
    </style>
</head>
<body>
    <div class="App">
        <h1>Llama Runner Async Proxy Dashboard</h1>
        
        <div class="dashboard">
            <h2>System Metrics</h2>
            <div class="metrics-grid" id="metrics-container">
                <p>Loading metrics...</p>
            </div>
            
            <div class="models-section">
                <h2>Active Models</h2>
                <div class="model-list" id="models-container">
                    <p>Loading models...</p>
                </div>
            </div>
            
            <div class="system-status">
                <h2>System Status</h2>
                <div id="status-container">
                    <p>Loading status...</p>
                </div>
            </div>
        </div>
        
        <div class="model-config">
            <h1>Model Configuration</h1>
            
            <div class="models-list">
                <h2>Available Models</h2>
                <ul id="model-list">
                    <li><p>Loading available models...</p></li>
                </ul>
            </div>
            
            <div class="model-details">
                <h2>Configuration</h2>
                <form id="config-form">
                    <div class="form-group">
                        <label for="port">Port:</label>
                        <input type="number" id="port" name="port" value="8081"/>
                    </div>
                    <button type="submit">Save Configuration</button>
                </form>
            </div>
        </div>
    </div>

    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://' + window.location.host + '/ws');
        
        ws.onopen = function() {
            console.log('WebSocket connected');
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'metrics') {
                updateMetrics(data.payload);
            } else if (data.type === 'models') {
                updateModels(data.payload);
            }
        };
        
        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
        
        ws.onclose = function() {
            console.log('WebSocket closed');
            // Try to reconnect after 5 seconds
            setTimeout(() => {
                location.reload();
            }, 5000);
        };
        
        // Update metrics display
        function updateMetrics(metrics) {
            const container = document.getElementById('metrics-container');
            
            if (metrics) {
                container.innerHTML = "
                    <div class='metric-card'>
                        <h3>Uptime</h3>
                        <p>${metrics.uptime || 'N/A'} seconds</p>
                    </div>
                    <div class='metric-card'>
                        <h3>Total Models</h3>
                        <p>${metrics.total_models || 0}</p>
                    </div>
                    <div class='metric-card'>
                        <h3>Active Runners</h3>
                        <p>${metrics.active_runners || 0}</p>
                    </div>
                    <div class='metric-card'>
                        <h3>Total Starts</h3>
                        <p>${metrics.total_starts || 0}</p>
                    </div>
                    <div class='metric-card'>
                        <h3>Total Stops</h3>
                        <p>${metrics.total_stops || 0}</p>
                    </div>
                    <div class='metric-card'>
                        <h3>Total Errors</h3>
                        <p>${metrics.total_errors || 0}</p>
                    </div>
                "
            } else {
                container.innerHTML = '<p>Failed to load metrics</p>';
            }
        }
        
        // Update models display
        function updateModels(models) {
            const container = document.getElementById('models-container');
            const modelList = document.getElementById('model-list');
            
            if (models && models.length > 0) {
                // Display models
                let modelsHtml = '';
                for (const model of models) {
                    modelsHtml += "
                        <div class='model-card'>
                            <h3>${model.name}</h3>
                            <p>Port: ${model.port}</p>
                            <p>Status: ${model.status}</p>
                        </div>
                    ";
                }
                container.innerHTML = modelsHtml;
                
                // Display available models in dropdown
                let modelOptions = '<li><p>-- Select a model --</p></li>';
                for (const model of models) {
                    modelOptions += "<li><button onclick=\"selectModel('" + model.name + "')\">" + model.name + "</button></li>";
                }
                modelList.innerHTML = modelOptions;
            } else {
                container.innerHTML = '<p>No models available</p>';
                modelList.innerHTML = '<li><p>No models available</p></li>';
            }
        }
        
        // Select model for configuration
        function selectModel(modelName) {
            alert("Selected model: " + modelName);
            // In a real app, this would populate the form with the selected model's config
        }
        
        // Handle form submission
        document.getElementById('config-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const configData = {};
            for (const [key, value] of formData.entries()) {
                if (value) {
                    configData[key] = value;
                }
            }
            
            try {
                // Save configuration
                const response = await fetch('/api/v1/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(configData)
                });
                
                if (response.ok) {
                    alert('Configuration saved successfully');
                } else {
                    alert('Error saving configuration');
                }
            } catch (error) {
                console.error('Network error:', error);
                alert('Network error saving configuration');
            }
        });
        
        // Initialize page
        window.addEventListener('load', function() {
            // WebSocket connection is established above
        });
    </script>
</body>
</html>
`);
});

// Setup WebSocket server
const { setupWebSocketServer } = require('./websocket-server');
setupWebSocketServer(server);

// Start server
server.listen(PORT, () => {
    console.log(`Llama Runner backend server running on port ${PORT}`);

           try{     
                if (response.ok) {
                    alert('Configuration saved successfully');
                } else {
                    alert('Error saving configuration');
                }
            } catch (error) {
                console.error('Network error:', error);
                alert('Network error saving configuration');
            }
        });

 