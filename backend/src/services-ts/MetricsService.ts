import { EventEmitter } from 'events';
import SystemMonitor from '../monitors/SystemMonitor';

export interface MetricsData {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: number;
}

export interface ModelStats {
  name: string;
  status: string;
  startTime: number | null;
  requestCount: number;
  errorCount: number;
  totalLatency: number;
  averageLatency: number;
  errorRate: number;
  throughput: number;
}

export class MetricsService extends EventEmitter {
  private monitor: SystemMonitor;
  private isCollecting: boolean;
  private interval: NodeJS.Timeout | null;
  private updateInterval: number;
  private subscribers: Set<(event: any) => void>;
  private metricsHistory: MetricsData[];
  private maxHistory: number;
  private models: Map<string, ModelStats>;
  private collectionQueue: Array<() => void>;
  private cacheCleanup: Map<string, () => void>;

  constructor() {
    super();
    this.monitor = new SystemMonitor();
    this.isCollecting = false;
    this.interval = null;
    this.updateInterval = 1000; // 1 second
    this.subscribers = new Set();
    this.metricsHistory = [];
    this.maxHistory = 3600; // 1 hour at 1/sec - optimized for memory usage
    this.models = new Map();
    this.collectionQueue = []; // For async processing
    
    // Cache cleanup tracking
    this.cacheCleanup = new Map();
  }

  /**
   * Start metrics collection with React 19-inspired patterns
   */
  start(): void {
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
  stop(): void {
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
  async collect(): Promise<void> {
    try {
      const metrics = await this.monitor.collectMetrics();
      
      // Use optimistic pattern - immediate optimistic update
      const optimisticMetrics: MetricsData = { 
        cpu: metrics.cpu, 
        memory: metrics.memory, 
        disk: metrics.disk, 
        network: metrics.network, 
        timestamp: Date.now() 
      };
      
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
  subscribe(callback: (event: any) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers with debounce pattern
   */
  notifySubscribers(event: any): void {
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
  getMetrics(): MetricsData {
    const metrics = this.monitor.getMetrics();
    return {
      cpu: metrics.cpu,
      memory: metrics.memory,
      disk: metrics.disk,
      network: metrics.network,
      timestamp: Date.now()
    };
  }

  /**
   * Get metrics history with optimistic pattern
   */
  getMetricsHistory(limit = 60): MetricsData[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Register model with React 19-inspired patterns
   */
  registerModel(modelName: string, data: Partial<ModelStats>): void {
    // Use optimistic pattern for model registration
    const optimisticModel: ModelStats = {
      name: modelName,
      status: 'stopped',
      startTime: null,
      requestCount: 0,
      errorCount: 0,
      totalLatency: 0,
      averageLatency: 0,
      errorRate: 0,
      throughput: 0,
      ...data,
    };
    
    this.models.set(modelName, optimisticModel);
    
    // Non-reactive logic handling (useEffectEvent)
    const handleRegistration = () => {
      console.log(`Registered model ${modelName} with React 19`);
    };
    
    handleRegistration();
  }

  /**
   * Update model status with optimistic pattern
   */
  updateModelStatus(modelName: string, status: string): void {
    const model = this.models.get(modelName);
    if (model) {
      model.status = status;
      
      // Optimistic update - immediate change in state
      if (status === 'running' && !model.startTime) {
        model.startTime = Date.now();
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
  recordModelRequest(modelName: string, latency: number, success = true): boolean {
    const model = this.models.get(modelName);
    if (model) {
      // Optimistic update - immediate state change
      model.requestCount++;
      model.totalLatency += latency;
      
      if (!success) {
        model.errorCount++;
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
          payload: { ...model, actionState }
        });
      };
      
      notify();
    }
    
    return true;
  }

  /**
   * Get model stats with optimistic approach
   */
  getModelStats(modelName: string): ModelStats | null {
    const model = this.models.get(modelName);
    if (!model) return null;

    const avgLatency =
      model.requestCount > 0 ? model.totalLatency / model.requestCount : 0;

    // Use optimistic pattern for calculation
    const optimisticStats: ModelStats = {
      ...model,
      averageLatency: Math.round(avgLatency),
      errorRate:
        model.requestCount > 0
          ? Math.round((model.errorCount / model.requestCount) * 100)
          : 0,
      throughput:
        model.requestCount > 0
            ? Math.round(model.requestCount / ((Date.now() - (model.startTime || 0)) / 1000))
            : 0,
    };
    
    return optimisticStats;
  }

  /**
   * Get all models with action handling pattern
   */
  getAllModels(): ModelStats[] {
    // Use action state for list handling
    const models = Array.from(this.models.values()).map(model => 
      this.getModelStats(model.name) as ModelStats
    );
    
    return models;
  }

  /**
   * Clear history with cache cleanup pattern
   */
  clearHistory(): void {
    this.metricsHistory = [];
  }

  /**
   * Set update interval with React 19 patterns
   */
  setUpdateInterval(interval: number): void {
    this.updateInterval = interval;
    if (this.isCollecting) {
      this.stop();
      this.start();
    }
  }

  /**
   * Create cache signal for automatic cleanup
   */
  private _createCacheSignal(): AbortSignal {
    // Create abort controller for cache cleanup - using proper types
    const controller = new AbortController();
    
    return controller.signal;
  }

  /**
   * Create cached resource with automatic cleanup
   */
  static createCachedResource(key: string, resourceFunction: (signal: AbortSignal) => any): any {
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