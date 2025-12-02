// backend/src/websocket-server.js
const WebSocket = require('ws');
const { loadConfig, loadModelsConfig } = require('./config');

let clients = new Set();

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        // Add client to set
        clients.add(ws);
        
        // Send initial data to new client
        sendInitialData(ws);
        
        ws.on('close', () => {
            clients.delete(ws);
        });
        
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            clients.delete(ws);
        });
    });

    // Function to send initial data to new WebSocket client
    function sendInitialData(ws) {
        const appConfig = loadConfig();
        const modelsConfig = loadModelsConfig();
        
        // Simulate metrics data
        const metrics = {
            uptime: 120,
            total_models: 5,
            active_runners: 3,
            total_starts: 10,
            total_stops: 2,
            total_errors: 0,
            memory_usage: { current: "1.2GB", peak: "2.4GB" },
            load_average: "0.75"
        };
        
        // Simulate models data
        const models = [
            { name: "llama-2-7b-chat", port: 8000, status: "running", temperature: 0.7, ctx_size: 32000, batch_size: 1024, threads: 10 },
            { name: "mistral-7b-instruct", port: 8001, status: "running", temperature: 0.8, ctx_size: 32000, batch_size: 1024, threads: 10 }, 
            { name: "gemma-2b", port: 8002, status: "stopped", temperature: 0.6, ctx_size: 16000, batch_size: 512, threads: 5 },
            { name: "phi-2", port: 8003, status: "loading", temperature: 0.5, ctx_size: 8000, batch_size: 256, threads: 2 },
            { name: "qwen-1.5b", port: 8004, status: "running", temperature: 0.7, ctx_size: 32000, batch_size: 1024, threads: 10 }
        ];

        // Send metrics data
        ws.send(JSON.stringify({
            type: 'metrics',
            payload: metrics
        }));

        // Send models data
        ws.send(JSON.stringify({
            type: 'models',
            payload: models
        }));
    }

    return wss;
}

module.exports = { setupWebSocketServer };