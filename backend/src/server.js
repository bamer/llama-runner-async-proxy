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

// Serve static files from react directory
app.use('/static', express.static(path.join(__dirname, '../react_proxy/static')));

// Serve React dashboard as default page
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../react_proxy/index.html');
    
    fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
            // Fallback HTML
            const htmlContent = `
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
    </style>
</head>
<body>
    <div class="App">
        <h1>Llama Runner Async Proxy Dashboard</h1>
        <p>Backend server running successfully!</p>
    </div>
</body>
</html>
            `;
            res.send(htmlContent);
        } else {
            res.send(data);
        }
    });
});

// API routes
app.get('/api/v1/models', (req, res) => {
    // Return model list from config
    const models = Object.keys(modelsConfig.models || {});
    res.json({ models: models.map(name => ({ name })) });
});

app.get('/api/v1/monitoring', (req, res) => {
    // Return basic monitoring information
    res.json({
        uptime: 0,
        total_models: Object.keys(modelsConfig.models || {}).length,
        active_runners: 0,
        total_starts: 0,
        total_stops: 0,
        total_errors: 0,
        memory_usage: { current: "N/A", peak: "N/A" },
        load_average: "N/A"
    });
});

app.post('/api/v1/config', (req, res) => {
    // Handle configuration updates
    res.json({ status: 'success' });
});

// Start server with service manager
const port = appConfig.webui?.port || 8081;
serviceManager.startServices().then(() => {
    server.listen(port, () => {
        console.log(`Llama Runner Async Proxy server running on http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Error starting services:', err);
});

module.exports = { app, server };