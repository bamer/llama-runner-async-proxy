# app/main.py

import sys

sys.path.insert(0, "/home/bamer/llama-runner-async-proxy")

# Simple main launch command
from fastapi import FastAPI
from llama_runner.config_loader import load_config, load_models_config
from llama_runner.headless_service_manager import HeadlessServiceManager
from app.api.v1.routers import api_router

# Load core configuration
app_config = load_config()
models_config = load_models_config()

# Create the FastAPI app with proper configuration
app = FastAPI(
    title="Llama Runner Async Proxy",
    version="1.0.0",
    description="Async HTTP proxy for Llama models",
)

# Initialize the service manager
manager = HeadlessServiceManager(app_config, models_config)
app.state.manager = manager

# Import and register API routes
app.include_router(api_router, prefix="/api/v1")


# Add monitoring endpoint for easy access
@app.get("/monitoring")
async def monitoring_page():
    # Return basic monitoring information that matches what the dashboard expects
    from llama_runner.services.metrics_collector import GLOBAL_METRICS_COLLECTOR

    collector = GLOBAL_METRICS_COLLECTOR or None

    if collector:
        metrics = collector.get_summary()
        return metrics
    else:
        return {
            "uptime": 0,
            "total_models": 0,
            "active_runners": 0,
            "total_starts": 0,
            "total_stops": 0,
            "total_errors": 0,
            "memory_usage": {"current": "N/A", "peak": "N/A"},
            "load_average": "N/A",
        }


# Add model configuration page
@app.get("/")
async def model_config_page():
    html_content = """
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
            // Load system metrics
            async function loadMetrics() {
                try {
                    const response = await fetch('/api/v1/monitoring');
                    const data = await response.json();
                    
                    const container = document.getElementById('metrics-container');
                    if (data) {
                        container.innerHTML = `
                            <div class="metric-card">
                                <h3>Uptime</h3>
                                <p>${data.uptime || 'N/A'} seconds</p>
                            </div>
                            <div class="metric-card">
                                <h3>Total Models</h3>
                                <p>${data.total_models || 0}</p>
                            </div>
                            <div class="metric-card">
                                <h3>Active Runners</h3>
                                <p>${data.active_runners || 0}</p>
                            </div>
                            <div class="metric-card">
                                <h3>Total Starts</h3>
                                <p>${data.total_starts || 0}</p>
                            </div>
                            <div class="metric-card">
                                <h3>Total Stops</h3>
                                <p>${data.total_stops || 0}</p>
                            </div>
                            <div class="metric-card">
                                <h3>Total Errors</h3>
                                <p>${data.total_errors || 0}</p>
                            </div>
                        `;
                    } else {
                        container.innerHTML = '<p>Failed to load metrics</p>';
                    }
                } catch (error) {
                    console.error('Error loading metrics:', error);
                    document.getElementById('metrics-container').innerHTML = 'Error loading metrics';
                }
            }

            // Load available models
            async function loadModels() {
                try {
                    const response = await fetch('/api/v1/models');
                    const data = await response.json();
                    
                    const container = document.getElementById('models-container');
                    const modelList = document.getElementById('model-list');
                    
                    if (data && data.models) {
                        // Display models
                        let modelsHtml = '';
                        for (const model of data.models) {
                            modelsHtml += `
                                <div class="model-card">
                                    <h3>${model.name}</h3>
                                    <p>Port: ${model.port}</p>
                                    <p>Status: ${model.status}</p>
                                </div>
                            `;
                        }
                        container.innerHTML = modelsHtml;
                        
                        // Display available models in dropdown
                        let modelOptions = '<li><p>-- Select a model --</p></li>';
                        for (const model of data.models) {
                            modelOptions += `<li><button onclick="selectModel('${model.name}')">${model.name}</button></li>`;
                        }
                        modelList.innerHTML = modelOptions;
                    } else {
                        container.innerHTML = '<p>No models available</p>';
                        modelList.innerHTML = '<li><p>No models available</p></li>';
                    }
                } catch (error) {
                    console.error('Error loading models:', error);
                    document.getElementById('models-container').innerHTML = 'Error loading models';
                    document.getElementById('model-list').innerHTML = '<li><p>Error loading models</p></li>';
                }
            }

            // Select model for configuration
            function selectModel(modelName) {
                alert(`Selected model: ${modelName}`);
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
                loadMetrics();
                loadModels();
                
                // Refresh every 5 seconds
                setInterval(() => {
                    loadMetrics();
                    loadModels();
                }, 5000);
            });
        </script>
    </body>
    </html>
    """
    return html_content


# Startup and shutdown events
@app.on_event("startup")
async def startup():
    await manager.start_services()


@app.on_event("shutdown")
async def shutdown():
    await manager.stop_services()


if __name__ == "__main__":
    # Determine host based on platform
    if sys.platform.startswith("win"):
        host = "127.0.0.1"
    else:
        host = "0.0.0.0"

    port = app_config.get("webui", {}).get("port", 8081)

    print(f"Starting FastAPI server on {host}:{port}")

    # Launch with uvicorn
    import uvicorn

    uvicorn.run("app.main:app", host=host, port=port, reload=False)
