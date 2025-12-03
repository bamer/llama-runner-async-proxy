// backend/src/websocket-server.js
const WebSocket = require('ws');
const { loadConfig, loadModelsConfig } = require('./config');
const SystemMonitor = require('./monitors/SystemMonitor');

let clients = new Set();
let systemMonitor = new SystemMonitor();
let metricsInterval = null;

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

    // Start metrics collection interval if not already started
    if (!metricsInterval) {
        metricsInterval = setInterval(async () => {
            try {
                await systemMonitor.collectMetrics();
                const metrics = systemMonitor.getMetrics();
                
                // Broadcast metrics to all connected clients
                broadcastToClients({
                    type: 'metrics',
                    payload: metrics
                });
            } catch (error) {
                console.error('Error collecting metrics:', error);
            }
        }, 2000); // Collect metrics every 2 seconds
    }

    // Function to send initial data to new WebSocket client
    async function sendInitialData(ws) {
        const appConfig = loadConfig();
        const modelsConfig = loadModelsConfig();
        
        // Collect fresh metrics
        try {
            await systemMonitor.collectMetrics();
            const metrics = systemMonitor.getMetrics();
            
            // Send metrics data with GPU info
            ws.send(JSON.stringify({
                type: 'metrics',
                payload: metrics
            }));
        } catch (error) {
            console.error('Error sending initial metrics:', error);
            ws.send(JSON.stringify({
                type: 'metrics',
                payload: { gpu: { devices: [] }, cpu: {}, memory: {}, disk: [] }
            }));
        }
    }

    // Helper function to broadcast to all clients
    function broadcastToClients(message) {
        const data = JSON.stringify(message);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    return wss;
}

module.exports = setupWebSocketServer;
