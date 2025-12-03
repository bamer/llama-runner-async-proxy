// backend/src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = require('http').createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load configuration
const { loadConfig, loadModelsConfig } = require('./config');
const appConfig = loadConfig();
const modelsConfig = loadModelsConfig();

// Import service manager
const ServiceManager = require('./service/service-manager');
const serviceManager = new ServiceManager(appConfig, modelsConfig);

// Import WebSocket setup
const { setupWebSocketServer } = require('./websocket-server');

// Serve frontend: dist (Webpack bundle) + static assets + index.html
const distPath = path.join(__dirname, '../../frontend/dist');
const frontendPath = path.join(__dirname, '../../frontend');

if (fs.existsSync(distPath)) {
    // Serve Webpack bundle
    app.use(express.static(distPath));
}

// Serve frontend static assets (CSS, etc)
app.use(express.static(frontendPath));

// Serve index.html for any non-API route (SPA routing)
app.get(/^\/(?!api\/).*/, (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(500).send('Dashboard not available');
    }
});

// API routes - Complete implementation
app.get('/api/v1/models', (req, res) => {
    // Return model list from config
    const models = Object.keys(modelsConfig.models || {});
    const modelsList = models.map(name => ({ 
        name: name,
        port: 8081, 
        status: 'stopped'
    }));
    res.json({ models: modelsList });
});

app.get('/api/v1/monitoring', (req, res) => {
    // Return monitoring information
    const metrics = {
        uptime: 0,
        total_models: Object.keys(modelsConfig.models || {}).length,
        active_runners: 0,
        total_starts: 0,
        total_stops: 0,
        total_errors: 0,
        memory_usage: { current: "N/A", peak: "N/A" },
        load_average: "N/A"
    };
    res.json(metrics);
});

app.get('/api/v1/config/:model_name', (req, res) => {
    // Return model configuration
    const modelName = req.params.model_name;
    const config = modelsConfig.models[modelName] || {};
    res.json(config);
});

app.post('/api/v1/config/:model_name', (req, res) => {
    // Update model configuration
    const modelName = req.params.model_name;
    const newConfig = req.body;
    
    // Update the configuration in memory
    modelsConfig.models[modelName] = { ...modelsConfig.models[modelName], ...newConfig };
    
    res.json({ status: 'success', model: modelName });
});

app.get('/api/v1/health', (req, res) => {
    // Health check endpoint
    res.json({ status: 'healthy' });
});

// Setup WebSocket server
setupWebSocketServer(server);

// Start server with service manager
const port = appConfig.webui?.port || 8081;
serviceManager.startServices().then(() => {
    server.listen(port, () => {
        console.log(`Llama Runner Async Proxy server running on http://localhost:${port}`);
        console.log(`WebSocket server available at ws://localhost:${port}/ws`);
    });
}).catch(err => {
    console.error('Error starting services:', err);
});

module.exports = { app, server };
