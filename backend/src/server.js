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
const metricsService = new MetricsService();

// Import API routes
const apiRoutes = require('./routes/api');

// Serve frontend
const distPath = path.join(__dirname, '../../frontend/dist');
const publicPath = path.join(__dirname, '../../frontend/public');
const srcPath = path.join(__dirname, '../../frontend/src');

// Serve static files
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.use(express.static(publicPath));

// API routes
app.use('/api/v1', apiRoutes(metricsService, modelsConfig));

// SPA catch-all for React Router
app.get('/*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found');
  }
});

// WebSocket setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial metrics
  socket.emit('metrics:update', metricsService.getMetrics());
  socket.emit('models:status', {
    models: metricsService.getAllModels(),
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle model control events
  socket.on('model:start', (modelName) => {
    metricsService.updateModelStatus(modelName, 'running');
    io.emit('model:status', {
      modelName,
      status: 'running',
    });
  });

  socket.on('model:stop', (modelName) => {
    metricsService.updateModelStatus(modelName, 'stopped');
    io.emit('model:status', {
      modelName,
      status: 'stopped',
    });
  });

  // Handle alert acknowledgment
  socket.on('alert:dismiss', (alertId) => {
    io.emit('alert:dismissed', { id: alertId });
  });
});

// Subscribe metrics service to emit updates to clients
metricsService.subscribe((event) => {
  if (event.type === 'metrics:update') {
    io.emit('metrics:update', event.payload);
  } else if (event.type === 'model:update') {
    io.emit('model:update', event.payload);
  }
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
