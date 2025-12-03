const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const ModelDiscoveryService = require('../services/ModelDiscoveryService');

const discoveryService = new ModelDiscoveryService();
let appConfig = null;

module.exports = (metricsService, modelsConfig) => {
  appConfig = modelsConfig;

  // ==================== MONITORING ====================
  router.get('/monitoring', (req, res) => {
    const metrics = metricsService.getMetrics();
    res.json(metrics);
  });

  router.get('/monitoring/history', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 60;
    const history = metricsService.getMetricsHistory(limit);
    res.json(history);
  });

  // ==================== MODELS - DISCOVERY & LISTING ====================

  // GET /api/v1/models - List all discovered models
  router.get('/models', async (req, res) => {
    try {
      const modelsConfigPath = path.join(__dirname, '../../config/models_config.json');
      const modelsConfig = JSON.parse(fs.readFileSync(modelsConfigPath, 'utf8'));
      const models = modelsConfig.models || {};
      const modelsList = Object.keys(models).map((name) => ({
        name,
        ...models[name],
      }));

      res.json({
        count: modelsList.length,
        models: modelsList,
      });
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  // POST /api/v1/models/discover - Discover models in a directory
  router.post('/models/discover', async (req, res) => {
    try {
      const { path: scanPath, maxDepth } = req.body;

      if (!scanPath) {
        return res.status(400).json({ error: 'Path is required' });
      }

      console.log(`🔍 Starting model discovery in: ${scanPath}`);
      const discoveredModels = await discoveryService.discoverModels(
        scanPath,
        maxDepth || 3
      );

      res.json({
        success: true,
        count: discoveredModels.length,
        models: discoveredModels,
      });
    } catch (error) {
      console.error('Discovery error:', error);
      res.status(500).json({
        error: 'Discovery failed',
        message: error.message,
      });
    }
  });

  // POST /api/v1/models/register - Register discovered models
  router.post('/models/register', async (req, res) => {
    try {
      const { models } = req.body;

      if (!Array.isArray(models)) {
        return res.status(400).json({ error: 'Models must be an array' });
      }

      const defaultParams = discoveryService.getDefaultParameters();
      const modelsConfigPath = path.join(__dirname, '../../config/models_config.json');
      let registered = 0;

      for (const model of models) {
        const modelConfig = {
          name: model.name,
          path: model.path,
          filename: model.filename,
          format: model.format,
          size: model.size,
          sizeGB: model.sizeGB,
          status: 'ready',
          discovered_at: new Date().toISOString(),
          ...defaultParams,
        };

        // Validation relaxée - on peut enregistrer des modèles même si le fichier n'existe pas
        try {
          discoveryService.saveModelConfig(modelsConfigPath, model.name, modelConfig);
          registered++;
          console.log(`✅ Registered model: ${model.name}`);
        } catch (err) {
          console.error(`Error registering ${model.name}:`, err.message);
        }
      }

      // Recharger la config depuis le fichier
      const updatedConfig = JSON.parse(fs.readFileSync(modelsConfigPath, 'utf8'));
      Object.assign(appConfig, updatedConfig);

      res.json({
        success: true,
        registered,
        models: Object.keys(appConfig.models || {}),
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message,
      });
    }
  });

  // GET /api/v1/models/:modelName - Get model details
  router.get('/models/:modelName', async (req, res) => {
    try {
      const { modelName } = req.params;
      const modelConfig = appConfig.models?.[modelName];

      if (!modelConfig) {
        return res.status(404).json({ error: 'Model not found' });
      }

      const stats = metricsService.getModelStats(modelName);

      res.json({
        name: modelName,
        config: modelConfig,
        stats,
      });
    } catch (error) {
      console.error('Error fetching model:', error);
      res.status(500).json({ error: 'Failed to fetch model' });
    }
  });

  // PUT /api/v1/models/:modelName - Update model configuration
  router.put('/models/:modelName', async (req, res) => {
    try {
      const { modelName } = req.params;
      const updates = req.body;

      if (!appConfig.models?.[modelName]) {
        return res.status(404).json({ error: 'Model not found' });
      }

      // Valider les mises à jour
      const updatedConfig = { ...appConfig.models[modelName], ...updates };
      const validation = discoveryService.validateModelConfig(updatedConfig);

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validation.errors,
        });
      }

      // Sauvegarder
      const modelsConfigPath = path.join(__dirname, '../config/models_config.json');
      discoveryService.saveModelConfig(modelsConfigPath, modelName, updatedConfig);
      appConfig.models[modelName] = updatedConfig;

      res.json({
        success: true,
        model: modelName,
        config: updatedConfig,
      });
    } catch (error) {
      console.error('Error updating model:', error);
      res.status(500).json({
        error: 'Failed to update model',
        message: error.message,
      });
    }
  });

  // DELETE /api/v1/models/:modelName - Remove model from config
  router.delete('/models/:modelName', async (req, res) => {
    try {
      const { modelName } = req.params;

      if (!appConfig.models?.[modelName]) {
        return res.status(404).json({ error: 'Model not found' });
      }

      delete appConfig.models[modelName];

      // Sauvegarder
      const modelsConfigPath = path.join(__dirname, '../config/models_config.json');
      fs.writeFileSync(modelsConfigPath, JSON.stringify(appConfig, null, 2));

      res.json({
        success: true,
        message: `Model ${modelName} removed`,
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      res.status(500).json({
        error: 'Failed to delete model',
        message: error.message,
      });
    }
  });

  // POST /api/v1/models/:modelName/start
  router.post('/models/:modelName/start', (req, res) => {
    const modelName = req.params.modelName;
    metricsService.updateModelStatus(modelName, 'running');
    res.json({ status: 'success', model: modelName, action: 'start' });
  });

  // POST /api/v1/models/:modelName/stop
  router.post('/models/:modelName/stop', (req, res) => {
    const modelName = req.params.modelName;
    metricsService.updateModelStatus(modelName, 'stopped');
    res.json({ status: 'success', model: modelName, action: 'stop' });
  });

  // ==================== CONFIGURATION ====================

  // GET /api/v1/config - Get full configuration
  router.get('/config', (req, res) => {
    res.json(appConfig);
  });

  // GET /api/v1/config/defaults - Get default parameters
  router.get('/config/defaults', (req, res) => {
    const defaults = discoveryService.getDefaultParameters();
    res.json(defaults);
  });

  // POST /api/v1/config/paths - Update models path
  router.post('/config/paths', async (req, res) => {
    try {
      const { modelsPath } = req.body;

      if (!modelsPath) {
        return res.status(400).json({ error: 'Models path is required' });
      }

      if (!fs.existsSync(modelsPath)) {
        return res.status(400).json({ error: 'Path does not exist' });
      }

      // Sauvegarder dans config
      const appConfigPath = path.join(__dirname, '../../config/app_config.json');
      const appConfigData = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
      appConfigData.modelsPath = modelsPath;
      fs.writeFileSync(appConfigPath, JSON.stringify(appConfigData, null, 2));

      res.json({
        success: true,
        modelsPath,
      });
    } catch (error) {
      console.error('Error updating paths:', error);
      res.status(500).json({
        error: 'Failed to update paths',
        message: error.message,
      });
    }
  });

  // POST /api/v1/config
  router.post('/config', (req, res) => {
    try {
      const updates = req.body;
      Object.assign(appConfig, updates);

      const modelsConfigPath = path.join(__dirname, '../../config/models_config.json');
      fs.writeFileSync(modelsConfigPath, JSON.stringify(appConfig, null, 2));

      res.json({ status: 'success', config: appConfig });
    } catch (error) {
      console.error('Error updating config:', error);
      res.status(500).json({
        error: 'Failed to update config',
        message: error.message,
      });
    }
  });

  // ==================== LOGS ====================

  router.get('/logs', (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const logsDir = path.join(__dirname, '../../logs');
      
      if (!fs.existsSync(logsDir)) {
        return res.json({ logs: [], total: 0 });
      }

      const files = fs.readdirSync(logsDir)
        .filter(f => f.endsWith('.log'))
        .sort()
        .reverse()
        .slice(0, 5);

      let logs = [];
      files.forEach(file => {
        const content = fs.readFileSync(path.join(logsDir, file), 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        logs = logs.concat(lines);
      });

      logs = logs.slice(-limit);
      res.json({ logs, total: logs.length });
    } catch (error) {
      console.error('Error reading logs:', error);
      res.status(500).json({ error: 'Failed to read logs' });
    }
  });

  // ==================== HEALTH ====================

  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: Date.now(),
      uptime: metricsService.getMetrics().uptime,
    });
  });

  return router;
};
