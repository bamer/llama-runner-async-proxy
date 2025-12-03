const SystemMonitor = require('../monitors/SystemMonitor');

class MetricsService {
  constructor() {
    this.monitor = new SystemMonitor();
    this.isCollecting = false;
    this.interval = null;
    this.updateInterval = 1000; // 1 second
    this.subscribers = new Set();
    this.metricsHistory = [];
    this.maxHistory = 3600; // 1 hour at 1/sec
    this.models = {};
  }

  start() {
    if (this.isCollecting) return;

    this.isCollecting = true;

    // Initial collection
    this.collect();

    // Set up interval for continuous collection
    this.interval = setInterval(() => {
      this.collect();
    }, this.updateInterval);

    console.log('MetricsService started');
  }

  stop() {
    if (!this.isCollecting) return;

    this.isCollecting = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('MetricsService stopped');
  }

  async collect() {
    try {
      const metrics = await this.monitor.collectMetrics();

      // Keep history (slide window)
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.maxHistory) {
        this.metricsHistory.shift();
      }

      // Notify subscribers
      this.notifySubscribers({
        type: 'metrics:update',
        payload: metrics,
      });
    } catch (error) {
      console.error('Error in metrics collection:', error);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event) {
    this.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  getMetrics() {
    return this.monitor.getMetrics();
  }

  getMetricsHistory(limit = 60) {
    return this.metricsHistory.slice(-limit);
  }

  // Model management
  registerModel(modelName, data) {
    this.models[modelName] = {
      name: modelName,
      status: 'stopped',
      startTime: null,
      requestCount: 0,
      errorCount: 0,
      totalLatency: 0,
      ...data,
    };
  }

  updateModelStatus(modelName, status) {
    if (this.models[modelName]) {
      this.models[modelName].status = status;
      if (status === 'running' && !this.models[modelName].startTime) {
        this.models[modelName].startTime = Date.now();
      }
    }
  }

  recordModelRequest(modelName, latency, success = true) {
    if (this.models[modelName]) {
      this.models[modelName].requestCount++;
      this.models[modelName].totalLatency += latency;

      if (!success) {
        this.models[modelName].errorCount++;
      }

      this.notifySubscribers({
        type: 'model:update',
        payload: this.models[modelName],
      });
    }
  }

  getModelStats(modelName) {
    if (!this.models[modelName]) return null;

    const model = this.models[modelName];
    const avgLatency =
      model.requestCount > 0 ? model.totalLatency / model.requestCount : 0;

    return {
      ...model,
      averageLatency: Math.round(avgLatency),
      errorRate:
        model.requestCount > 0
          ? Math.round((model.errorCount / model.requestCount) * 100)
          : 0,
      throughput:
        model.requestCount > 0
          ? Math.round(model.requestCount / ((Date.now() - model.startTime) / 1000))
          : 0,
    };
  }

  getAllModels() {
    return Object.values(this.models).map((model) =>
      this.getModelStats(model.name)
    );
  }

  clearHistory() {
    this.metricsHistory = [];
  }

  setUpdateInterval(interval) {
    this.updateInterval = interval;
    if (this.isCollecting) {
      this.stop();
      this.start();
    }
  }
}

module.exports = MetricsService;
