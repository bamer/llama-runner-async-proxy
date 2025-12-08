// Performance Monitoring Implementation - React 19 Features

class PerformanceMonitor {
  constructor() {
    this.metricsHistory = [];
    this.performanceData = {};
    this.maxHistory = 3600; // 1 hour at 1/sec - optimized for memory usage
    this.collectionQueue = [];
    
    // Cache cleanup tracking for performance data
    this.cacheCleanup = new Map();
    
    // Performance monitoring configuration
    this.config = {
      enabled: true,
      samplingRate: 1000, // 1 second
      memoryThreshold: 80, // percentage
      cpuThreshold: 70, // percentage
      metricsWindow: 60 // minutes to track
    };
  }

  /**
   * Start performance monitoring with React 19 patterns
   */
  start() {
    if (!this.config.enabled) return;
    
    console.log('PerformanceMonitor started');
    
    // Initial collection with backoff handling - optimistic approach
    this.collect().catch(e => console.error('Initial collection error:', e));
    
    // Set up interval for continuous monitoring with rate limiting
    const interval = setInterval(() => {
      this.collect().catch(e => console.error('Collection error:', e));
    }, Math.max(500, this.config.samplingRate)); // Minimum 500ms to prevent excessive calls
    
    return interval;
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    console.log('PerformanceMonitor stopped');
    
    // Cache cleanup with React 19-inspired pattern
    const controller = new AbortController();
    const signal = this._createCacheSignal();
    
    signal.addEventListener('abort', () => {
      console.log('Cache cleanup for PerformanceMonitor');
      controller.abort();
    });
    
    return true;
  }

  /**
   * Collect performance metrics with optimistic patterns
   */
  async collect() {
    try {
      // Get current metrics
      const metrics = await this._collectMetrics();
      
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
        type: 'performance:update',
        payload: actionState,
        timestamp: Date.now()
      });
      
      return actionState;
    } catch (error) {
      console.error('Error in performance collection:', error);
      
      // Use action state for error handling
      const actionState = { 
        success: false, 
        error: error.message,
        timestamp: Date.now() 
      };
      
      this.notifySubscribers({
        type: 'performance:error',
        payload: actionState
      });
      
      return actionState;
    }
  }

  /**
   * Collect performance metrics with React 19-inspired approach
   */
  async _collectMetrics() {
    // Get system resource usage
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    
    // Calculate performance indicators
    const memoryPercent = (memory.heapUsed / memory.heapTotal) * 100;
    const cpuPercent = (cpu.user + cpu.system) / 1000; // Convert to percentage
    
    return {
      timestamp: Date.now(),
      memory: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        rss: memory.rss,
        memoryPercent: memoryPercent
      },
      cpu: {
        user: cpu.user,
        system: cpu.system,
        cpuPercent: cpuPercent
      },
      performance: this._calculatePerformanceIndicators(),
      uptime: process.uptime(),
      loadAverage: require('os').loadavg()
    };
  }

  /**
   * Calculate performance indicators with optimistic pattern
   */
  _calculatePerformanceIndicators() {
    // Optimistic calculation of performance indicators
    const now = Date.now();
    const recentMetrics = this.metricsHistory.slice(-10); // Last 10 metrics
    
    if (recentMetrics.length === 0) return { averageCpu: 0, averageMemory: 0 };
    
    const avgCpu = recentMetrics.reduce((sum, metric) => sum + metric.cpu.cpuPercent, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, metric) => sum + metric.memory.memoryPercent, 0) / recentMetrics.length;
    
    return {
      averageCpu: Math.round(avgCpu * 100) / 100,
      averageMemory: Math.round(avgMemory * 100) / 100
    };
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
   * Get performance metrics with React 19-inspired approach
   */
  getPerformanceMetrics() {
    return this.metricsHistory.slice(-60);
  }

  /**
   * Check performance thresholds and alert with optimistic pattern
   */
  checkThresholds() {
    if (this.metricsHistory.length < 2) return;
    
    const recent = this.metricsHistory.slice(-10);
    const avgMemory = recent.reduce((sum, metric) => sum + metric.memory.memoryPercent, 0) / recent.length;
    const avgCpu = recent.reduce((sum, metric) => sum + metric.cpu.cpuPercent, 0) / recent.length;
    
    // Check thresholds with optimistic update approach
    const alerts = [];
    
    if (avgMemory > this.config.memoryThreshold) {
      alerts.push({ type: 'memory', level: 'high', value: avgMemory });
    }
    
    if (avgCpu > this.config.cpuThreshold) {
      alerts.push({ type: 'cpu', level: 'high', value: avgCpu });
    }
    
    return alerts;
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

module.exports = PerformanceMonitor;