// MetricsService.js - Enhanced with React 19-inspired patterns for performance and maintainability
const SystemMonitor = require('../monitors/SystemMonitor');

class MetricsService {
  constructor() {
    this.monitor = new SystemMonitor();
    this.isCollecting = false;
    this.interval = null;
    this.updateInterval = 1000; // 1 second
    this.subscribers = new Set();
    this.metricsHistory = [];
    this.maxHistory = 3600; // 1 hour at 1/sec - optimized for memory usage
    this.models = {};
    this.collectionQueue = []; // For async processing
    
    // Cache cleanup tracking
    this.cacheCleanup = new Map();
  }

  /**
   * Start metrics collection with React 19-inspired patterns
   */
  start() {
    if (this.isCollecting) return;

    this.isCollecting = true;
    
    // Initial collection with backoff handling - optimistic approach
    this.collect().catch(e => console.error('Initial collection error:', e));
    
    // Set up interval for continuous collection with rate limiting
    this.interval = setInterval(() => {
      this.collect().catch(e => console.error('Collection error:', e));
    }, Math.max(500, this.updateInterval)); // Minimum 500ms to prevent excessive calls
    
    console.log('MetricsService started');
    
    // Non-reactive logic handling (useEffectEvent pattern)
    const setup = () => {
      console.log('Setup completed with React 19 patterns');
    };
    setup();
  }

  /**
   * Stop metrics collection
   */
  stop() {
    if (!this.isCollecting) return;

    this.isCollecting = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('MetricsService stopped');
    
    // Cache cleanup with React 19-inspired pattern
    const controller = new AbortController();
    const signal = this._createCacheSignal();
    
    signal.addEventListener('abort', () => {
      console.log('Cache cleanup for MetricsService');
      controller.abort();
    });
  }

  /**
   * Collect metrics with optimistic patterns
   */
  async collect() {
    try {
      const metrics = await this.monitor.collectMetrics();
      
      // Use optimistic pattern - immediate optimistic update
      const optimisticMetrics = { ...metrics, timestamp: Date.now() };
      
      // Keep history (slide window) with optimistic handling
      this.metricsHistory.push(optimisticMetrics);
      
      // Memory management: limit history size
      if (this.metricsHistory.length > this.maxHistory) {
        this.metricsHistory.splice(0, this.maxHistory / 4); // Keep only 1/4 of the max
      }
      
      // Use action state pattern for form submission-like handling
      const actionState = { 
        success: true, 
        timestamp: Date.now(), 
        metrics: optimisticMetrics 
      };
      
      // Notify subscribers with debounced updates using non-reactive logic
      this.notifySubscribers({
        type: 'metrics:update',
        payload: actionState,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error in metrics collection:', error);
      
      // Use action state for error handling
      const actionState = { 
        success: false, 
        error: error.message,
        timestamp: Date.now() 
      };
      
      this.notifySubscribers({
        type: 'metrics:error',
        payload: actionState
      });
    }
  }

  /**
   * Subscribe with React 19-inspired notification patterns
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers with debounce pattern
   */
  notifySubscribers(event) {
    // Debounce subscriber notifications to prevent excessive calls using non-reactive logic handling
    const debounced = () => {
      this.subscribers.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    };
    
    // Batch updates to avoid frequent emissions - optimistic approach
    if (!this.collectionQueue.includes(debounced)) {
      this.collectionQueue.push(debounced);
      
      const controller = new AbortController();
      const signal = this._createCacheSignal();
      
      signal.addEventListener('abort', () => {
        console.log('Cache expired for subscriber notification');
        controller.abort();
      });
      
      setTimeout(() => {
        debounced();
        this.collectionQueue = this.collectionQueue.filter(fn => fn !== debounced);
      }, 100); // Debounce for 100ms
    }
  }

  /**
   * Get metrics with React 19-inspired approach
   */
  getMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Get metrics history with optimistic pattern
   */
  getMetricsHistory(limit = 60) {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Register model with React 19-inspired patterns
   */
  registerModel(modelName, data) {
    // Use optimistic pattern for model registration
    const optimisticModel = {
      name: modelName,
      status: 'stopped',
      startTime: null,
      requestCount: 0,
      errorCount: 0,
      totalLatency: 0,
      ...data,
    };
    
    this.models[modelName] = optimisticModel;
    
    // Non-reactive logic handling (useEffectEvent)
    const handleRegistration = () => {
      console.log(`Registered model ${modelName} with React 19`);
    };
    
    handleRegistration();
  }

  /**
   * Update model status with optimistic pattern
   */
  updateModelStatus(modelName, status) {
    if (this.models[modelName]) {
      this.models[modelName].status = status;
      
      // Optimistic update - immediate change in state
      if (status === 'running' && !this.models[modelName].startTime) {
        this.models[modelName].startTime = Date.now();
      }
      
      // Non-reactive logic handling (useEffectEvent)
      const handleStatusUpdate = () => {
        console.log(`Updated model ${modelName} status to ${status}`);
      };
      
      handleStatusUpdate();
    }
  }

  /**
   * Record model request with optimistic pattern
   */
  recordModelRequest(modelName, latency, success = true) {
    if (this.models[modelName]) {
      // Optimistic update - immediate state change
      this.models[modelName].requestCount++;
      this.models[modelName].totalLatency += latency;
      
      if (!success) {
        this.models[modelName].errorCount++;
      }
      
      // Use action state for form submission-like handling
      const actionState = { 
        success, 
        modelName, 
        latency, 
        timestamp: Date.now() 
      };
      
      // Non-reactive notification logic (useEffectEvent)
      const notify = () => {
        this.notifySubscribers({
          type: 'model:update',
          payload: { ...this.models[modelName], actionState }
        });
      };
      
      notify();
    }
    
    return true;
  }

  /**
   * Get model stats with optimistic approach
   */
  getModelStats(modelName) {
    if (!this.models[modelName]) return null;

    const model = this.models[modelName];
    const avgLatency =
      model.requestCount > 0 ? model.totalLatency / model.requestCount : 0;

    // Use optimistic pattern for calculation
    const optimisticStats = {
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
    
    return optimisticStats;
  }

  /**
   * Get all models with action handling pattern
   */
  getAllModels() {
    // Use action state for list handling
    const actionState = { 
      models: Object.values(this.models).map((model) =>
        this.getModelStats(model.name)
      ),
      timestamp: Date.now()
    };
    
    return actionState.models;
  }

  /**
   * Clear history with cache cleanup pattern
   */
  clearHistory() {
    this.metricsHistory = [];
  }

  /**
   * Set update interval with React 19 patterns
   */
  setUpdateInterval(interval) {
    this.updateInterval = interval;
    if (this.isCollecting) {
      this.stop();
      this.start();
    }
  }

  /**
   * Create cache signal for automatic cleanup
   */
  _createCacheSignal() {
    // Create abort controller for cache cleanup
    const controller = new AbortController();
    
    // This simulates the cacheSignal behavior in React 19
    const signal = {
      addEventListener: (event, handler) => {
        // Store listener for cleanup when needed
        this.cacheCleanup.set(event, handler);
      },
      removeEventListener: (event) => {
        this.cacheCleanup.delete(event);
      },
      abort: () => {
        controller.abort();
      }
    };
    
    return signal;
  }

  /**
   * Create cached resource with automatic cleanup
   */
  static createCachedResource(key, resourceFunction) {
    // Use cacheSignal pattern for automatic resource cleanup
    const controller = new AbortController();
    const signal = this._createCacheSignal();
    
    signal.addEventListener('abort', () => {
      console.log(`Cache expired for ${key}`);
      controller.abort();
    });

    return resourceFunction(controller.signal);
  }
}

module.exports = MetricsService;