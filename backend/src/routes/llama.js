const express = require('express');
const router = express.Router();

/**
 * Routes pour le contrôle llama-server
 * Ces routes véritablement lancent et stoppent llama-server
 */

module.exports = (llamaServerService, llamaMetricsService, modelsConfig, io) => {
  /**
   * POST /llama/models/:modelName/start - Lancer un modèle
   */
  router.post('/models/:modelName/start', async (req, res) => {
    try {
      const modelName = req.params.modelName;
      const model = modelsConfig.models?.[modelName];

      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      // Vérifier si déjà lancé
      if (llamaServerService.isRunning(modelName)) {
        return res.status(400).json({ error: 'Model already running' });
      }

      // Vérifier limite de modèles parallèles
      const runningCount = llamaServerService.getRunningCount();
      const maxParallel = modelsConfig.maxParallelModels || 4;
      if (runningCount >= maxParallel) {
        return res.status(429).json({
          error: 'Max parallel models exceeded',
          running: runningCount,
          max: maxParallel,
        });
      }

      // Lancer le serveur
      console.log(`\n🚀 Starting model ${modelName}...`);
      const result = await llamaServerService.startModel(modelName, model);

      // Enregistrer pour le monitoring
      llamaMetricsService.registerModel(
        modelName,
        model.host || '127.0.0.1',
        model.port || 8000
      );
      llamaMetricsService.startPolling(modelName, 1000);

      // Notifier les clients WebSocket
      io?.emit('model:started', {
        modelName,
        pid: result.pid,
        timestamp: Date.now(),
      });

      res.json({
        status: 'success',
        model: modelName,
        pid: result.pid,
        message: `Model ${modelName} started on port ${model.port}`,
      });
    } catch (error) {
      console.error(`Error starting model:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /llama/models/:modelName/stop - Arrêter un modèle
   */
  router.post('/models/:modelName/stop', async (req, res) => {
    try {
      const modelName = req.params.modelName;

      if (!llamaServerService.isRunning(modelName)) {
        return res.status(400).json({ error: 'Model not running' });
      }

      console.log(`⏹️  Stopping model ${modelName}...`);
      llamaServerService.stopModel(modelName);
      llamaMetricsService.stopPolling(modelName);

      // Notifier les clients WebSocket
      io?.emit('model:stopped', {
        modelName,
        timestamp: Date.now(),
      });

      res.json({
        status: 'success',
        model: modelName,
        message: `Model ${modelName} stopped`,
      });
    } catch (error) {
      console.error(`Error stopping model:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /llama/status - Obtenir le statut de tous les modèles
   */
  router.get('/status', (req, res) => {
    const status = llamaServerService.getAllStatus();
    const modelMetrics = {};
    for (const name of Object.keys(status)) {
      modelMetrics[name] = llamaMetricsService.getMetrics(name);
    }
    res.json({
      status: 'success',
      models: status,
      metrics: modelMetrics,
      running: llamaServerService.getRunningCount(),
    });
  });

  /**
   * GET /llama/models/:modelName/metrics - Obtenir les métriques d'un modèle
   */
  router.get('/models/:modelName/metrics', (req, res) => {
    const modelName = req.params.modelName;
    const limit = req.query.limit ? parseInt(req.query.limit) : 60;

    const metrics = llamaMetricsService.getMetrics(modelName);
    const history = llamaMetricsService.getHistory(modelName, limit);

    if (!metrics) {
      return res.status(404).json({ error: 'Model not found or not running' });
    }

    res.json({
      status: 'success',
      model: modelName,
      metrics,
      history,
    });
  });

  return router;
};
