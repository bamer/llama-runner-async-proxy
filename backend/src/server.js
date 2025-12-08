// backend/src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load configuration
const { loadConfig, loadModelsConfig } = require('./config');
const appConfig = loadConfig();
const modelsConfig = loadModelsConfig();

// Import services
const MetricsService = require('./services/MetricsService');
const LogService = require('./services/LogService');
const LlamaServerService = require('./services/LlamaServerService');
const LlamaMetricsService = require('./services/LlamaMetricsService');

const metricsService = new MetricsService();
const logService = new LogService();
const llamaServerService = new LlamaServerService();
const llamaMetricsService = new LlamaMetricsService();

// Import API routes
const apiRoutes = require('./routes/api');
const llamaRoutes = require('./routes/llama');

// Serve frontend
const distPath = path.join(__dirname, '../../frontend/dist');
const publicPath = path.join(__dirname, '../../frontend/public');
const srcPath = path.join(__dirname, '../../frontend/src');

// Serve static files
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.use(express.static(publicPath));

// API routes - passer les nouveaux services
app.use('/api/v1', apiRoutes(metricsService, modelsConfig, llamaServerService, llamaMetricsService, io));
app.use('/api/v1/llama', llamaRoutes(llamaServerService, llamaMetricsService, modelsConfig, io));

// SPA catch-all for React Router - Handle fallback routes properly via middleware
app.use((req, res, next) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found');
  }
});

// Remove the problematic line to test if it's the only issue
// Note: This route is supposed to be a catch-all for React Router to handle SPA navigation properly

// WebSocket setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial metrics
  socket.emit('metrics:update', metricsService.getMetrics());
  socket.emit('models:status', {
    models: metricsService.getAllModels(),
  });

  // Send initial logs
  socket.emit('logs:history', logService.getLogs(100));
  socket.emit('logs:stats', logService.getStats());

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle model control events via WebSocket
  socket.on('model:start', async (modelName) => {
    try {
      const result = await llamaServerService.startModel(modelName, modelsConfig.models[modelName]);
      io.emit('model:status', {
        modelName,
        status: 'running',
        pid: result.pid,
      });
    } catch (error) {
      io.emit('model:error', {
        modelName,
        error: error.message,
      });
    }
  });

  socket.on('model:stop', async (modelName) => {
    try {
      llamaServerService.stopModel(modelName);
      io.emit('model:status', {
        modelName,
        status: 'stopped',
      });
    } catch (error) {
      io.emit('model:error', {
        modelName,
        error: error.message,
      });
    }
  });

  // Handle alert acknowledgment
  socket.on('alert:dismiss', (alertId) => {
    io.emit('alert:dismissed', { id: alertId });
  });
});

// Subscribe à LlamaMetricsService pour envoyer les updates en temps réel
llamaMetricsService.on('metrics-update', (data) => {
  io.emit('llama-metrics:update', data);
});

// Subscribe metrics service to emit updates to clients
metricsService.subscribe((event) => {
  if (event.type === 'metrics:update') {
    io.emit('metrics:update', event.payload);
  } else if (event.type === 'model:update') {
    io.emit('model:update', event.payload);
  }
});

// Subscribe log service to emit logs to clients
logService.subscribe((log) => {
  io.emit('logs:update', log);
  io.emit('logs:stats', logService.getStats());
});

// Start services
const port = appConfig.webui?.port || 8081;
const host = appConfig.webui?.host || '0.0.0.0';

metricsService.start();

server.listen(port, host, () => {
  console.log(`🦙 Llama Runner Dashboard running on http://${host}:${port}`);
  console.log(`📊 Dashboard available at http://localhost:${port}`);
  console.log(`🔌 WebSocket server available at ws://localhost:${port}`);
});

module.exports = { server, app, io, llamaServerService, llamaMetricsService };
