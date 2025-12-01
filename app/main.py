# app/main.py
import sys

sys.path.insert(0, "/home/bamer/llama-runner-async-proxy")

# Simple main launch command
import uvicorn
from fastapi import FastAPI
import os

# Import configuration and services
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
    return {"message": "Monitoring interface - to be implemented"}


# Add model configuration page
@app.get("/")
async def model_config_page():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Llama Runner Configuration</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
            .container { max-width: 1200px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            .config-section { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 20px; margin: 10px 0; }
            .form-group { margin: 15px 0; }
            label { display: block; font-weight: bold; margin-bottom: 5px; }
            input, select, textarea { padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 300px; }
            button { background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; margin-top: 10px; }
            button:hover { background-color: #0056b3; }
            .status { color: #28a745; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Llama Runner Async Proxy Configuration</h1>
            
            <div class="config-section">
                <h2>Application Settings</h2>
                <form id="app-config-form">
                    <div class="form-group">
                        <label for="port">Port:</label>
                        <input type="number" id="port" name="port" value="8081"/>
                    </div>
                    <div class="form-group">
                        <label for="host">Host:</label>
                        <input type="text" id="host" name="host" value="0.0.0.0"/>
                    </div>
                    <button type="submit">Save Application Settings</button>
                </form>
            </div>

            <div class="config-section">
                <h2>Model Selection & Configuration</h2>
                <form id="model-config-form">
                    <div class="form-group">
                        <label for="model-select">Select Model:</label>
                        <select id="model-select" name="model-select">
                            <option value="">-- Select a model --</option>
                            <!-- Models will be populated dynamically -->
                        </select>
                    </div>
                    
                    <div class="config-section">
                        <h3>Model Configuration Parameters</h3>
                        <div id="config-params">
                            <p>Select a model to see configuration options.</p>
                        </div>
                    </div>
                    
                    <button type="submit">Save Model Configuration</button>
                </form>
            </div>

            <div class="config-section">
                <h2>System Status</h2>
                <div id="system-status">
                    <p>Loading system status...</p>
                </div>
            </div>
        </div>

        <script>
            // Load system status
            async function loadSystemStatus() {
                try {
                    const response = await fetch('/api/v1/monitoring');
                    const data = await response.json();
                    document.getElementById('system-status').innerHTML = 
                        `<pre>${JSON.stringify(data, null, 2)}</pre>`;
                } catch (error) {
                    document.getElementById('system-status').innerHTML = 'Error loading status';
                }
            }

            // Load available models
            async function loadModels() {
                try {
                    const response = await fetch('/api/v1/models');
                    const data = await response.json();
                    const modelSelect = document.getElementById('model-select');
                    
                    // Clear existing options and add default option
                    modelSelect.innerHTML = '<option value="">-- Select a model --</option>';
                    
                    // Add models to dropdown if available
                    if (data.models && data.models.length > 0) {
                        for (const model of data.models) {
                            const option = document.createElement('option');
                            option.value = model.name;
                            option.textContent = model.name;
                            modelSelect.appendChild(option);
                        }
                    } else {
                        modelSelect.innerHTML += '<option value="">No models available</option>';
                    }
                    
                } catch (error) {
                    console.error('Error loading models:', error);
                }
            }

            // Handle form submission
            document.getElementById('app-config-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const configData = {};
                for (const [key, value] of formData.entries()) {
                    if (value) {
                        configData[key] = value;
                    }
                }
                
                try {
                    // Save application settings
                    const response = await fetch('/api/v1/config/app', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(configData)
                    });
                    
                    if (response.ok) {
                        alert('Application settings saved successfully');
                    } else {
                        alert('Error saving application settings');
                    }
                } catch (error) {
                    alert('Network error saving application settings');
                }
            });

            // Handle model configuration form submission
            document.getElementById('model-config-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const modelSelect = document.getElementById('model-select');
                const modelName = modelSelect.value;
                
                if (!modelName) {
                    alert('Please select a model');
                    return;
                }
                
                const formData = new FormData(this);
                const configData = {};
                for (const [key, value] of formData.entries()) {
                    if (value) {
                        configData[key] = value;
                    }
                }
                
                try {
                    // Save model configuration
                    const response = await fetch(`/api/v1/config/${modelName}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(configData)
                    });
                    
                    if (response.ok) {
                        alert('Model configuration saved successfully');
                    } else {
                        alert('Error saving model configuration');
                    }
                } catch (error) {
                    alert('Network error saving model configuration');
                }
            });

            // Initialize page
            window.addEventListener('load', function() {
                loadSystemStatus();
                loadModels();
            });
        </script>
    </body>
    </html>
    """
    return html_content


# Include frontend static files if they exist
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    from fastapi.staticfiles import StaticFiles

    app.mount(
        "/static",
        StaticFiles(directory=os.path.join(frontend_path, "static")),
        name="static",
    )

    from fastapi.responses import HTMLResponse

    @app.get("/", response_class=HTMLResponse)
    async def serve_spa():
        index_path = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_path):
            with open(index_path) as f:
                return HTMLResponse(f.read())
        else:
            return HTMLResponse("<html><body>Llama Runner Async Proxy</body></html>")


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
    uvicorn.run("app.main:app", host=host, port=port, reload=False, log_level="debug")
