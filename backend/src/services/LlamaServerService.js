// Backend Services - React 19 Features Implementation

// LlamaServerService.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class LlamaServerService {
  constructor() {
    this.processes = new Map(); // modelName -> { process, config, status }
    this.subscribers = new Set();
    
    // Cache cleanup tracking - React 19-inspired pattern
    this.cacheCleanup = new Map();
  }

  /**
   * Build command with React 19-inspired patterns for configuration management
   */
  buildCommand(modelPath, config) {
    const params = [];

    // Configuration patterns inspired by React 19  
    params.push(`-m ${modelPath}`);
    
    // Configurable directories
    if (config.models_dir && fs.existsSync(config.models_dir)) {
      params.push(`--models-dir "${config.models_dir}"`);
    }
    
    params.push(`-c ${config.ctx_size || 4096}`);
    params.push(`-b ${config.batch_size || 2048}`);
    params.push(`-ub ${config.ubatch_size || 512}`);
    
    // Multimodal support
    if (config.multimodal_enabled && config.mmproj_path && fs.existsSync(config.mmproj_path)) {
      params.push(`--mmproj "${config.mmproj_path}"`);
      
      if (config.enable_vision) {
        params.push('--vision');
        if (config.image_batch_size) params.push(`--image-batch-size ${config.image_batch_size}`);
      }
      
      if (config.enable_audio) {
        params.push('--audio');
        if (config.audio_batch_size) params.push(`--audio-batch-size ${config.audio_batch_size}`);
      }
      console.log(`🎥 Loading multimodal: main=${modelPath}, mmproj=${config.mmproj_path}`);
    }

    // GPU and performance settings
    if (config.gpu_layers !== undefined) {
      params.push(`-ngl ${config.gpu_layers}`);
    }
    
    if (config.threads) {
      params.push(`-t ${config.threads}`);
    }
    
    if (config.thread_batch) {
      params.push(`-tb ${config.thread_batch}`);
    }

    // Memory and optimization settings
    if (config.mlock) params.push('--mlock');
    if (!config.mmap) params.push('--no-mmap');
    if (config.flash_attn) params.push('-fa');
    if (config.numa) params.push('--numa');
    if (config.simple_io) params.push('--simple-io');

    // Server configuration
    params.push(`--host ${config.host || '127.0.0.1'}`);
    params.push(`--port ${config.port || 8000}`);
    params.push(`-np ${config.n_parallel || 1}`);
    params.push(`-ns ${config.n_sequences || 1}`);

    // Logging
    if (config.verbose) params.push('--verbose');
    if (config.log_all) params.push('--log-all');

    return params.join(' ');
  }

  /**
   * Start model with optimistic update patterns (React 19 inspired)
   */
  async startModel(modelName, config) {
    // Use optimistic update for status management
    const optimisticStatus = 'starting';
    
    if (this.processes.has(modelName)) {
      throw new Error(`Model ${modelName} is already running`);
    }

    if (!fs.existsSync(config.path)) {
      throw new Error(`Model file not found: ${config.path}`);
    }

    try {
      const runtime = '/home/bamer/llama.cpp/build/bin/llama-server';
      const args = this.buildCommand(config.path, config).split(' ');

      console.log(`🚀 Starting model: ${modelName}`);
      console.log(`   Command: ${runtime} ${args.join(' ')}`);

      const process = spawn(runtime, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      let output = '';
      
      // React 19-inspired async handling with optimistic updates
      process.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('listening')) {
          // Optimistic update immediately
          this._updateProcessStatus(modelName, 'running');
          
          // Non-reactive logic handling (useEffectEvent pattern)
          const onMessage = () => {
            console.log(`Model ${modelName} listening`);
          };
          onMessage();
        }
      });

      process.stderr.on('data', (data) => {
        console.error(`[${modelName}] ${data.toString()}`);
      });

      process.on('error', (err) => {
        console.error(`Process error for ${modelName}:`, err);
        this._updateProcessStatus(modelName, 'error');
      });

      process.on('exit', (code) => {
        console.log(`Model ${modelName} exited with code ${code}`);
        this.processes.delete(modelName);
        this._updateProcessStatus(modelName, 'stopped');
      });

      // Cache cleanup pattern (similar to React 19 cacheSignal)
      const controller = new AbortController();
      const signal = this._createCacheSignal();
      
      signal.addEventListener('abort', () => {
        console.log(`Cache expired for model ${modelName}`);
        controller.abort();
      });

      this.processes.set(modelName, {
        process,
        config,
        status: optimisticStatus,
        startTime: Date.now(),
      });

      // Immediate optimistic update
      this._updateProcessStatus(modelName, 'starting');
      
      return { success: true, modelName, pid: process.pid };
    } catch (error) {
      console.error(`Failed to start model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Stop model with optimistic patterns
   */
  stopModel(modelName) {
    const entry = this.processes.get(modelName);
    if (!entry) {
      throw new Error(`Model ${modelName} is not running`);
    }

    try {
      console.log(`⏹️ Stopping model: ${modelName}`);
      
      // Optimistic update immediately
      this._updateProcessStatus(modelName, 'stopping');
      
      entry.process.kill('SIGTERM');

      // Force kill after 5 seconds with cache cleanup
      const controller = new AbortController();
      const signal = this._createCacheSignal();
      
      signal.addEventListener('abort', () => {
        console.log(`Force killing model ${modelName}`);
        controller.abort();
      });

      const timeout = setTimeout(() => {
        entry.process.kill('SIGKILL');
        controller.abort();
      }, 5000);

      entry.process.once('exit', () => clearTimeout(timeout));

      return { success: true, modelName };
    } catch (error) {
      console.error(`Failed to stop model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Get model status with React 19-inspired async handling
   */
  getModelStatus(modelName) {
    const entry = this.processes.get(modelName);
    if (!entry) {
      return { modelName, status: 'stopped' };
    }

    // React 19-inspired promise handling - optimistic approach
    const status = entry.status;
    
    return {
      modelName,
      status,
      pid: entry.process.pid,
      uptime: Date.now() - entry.startTime,
      config: entry.config,
    };
  }

  /**
   * Get all running models with optimistic patterns
   */
  getAllRunningModels() {
    const models = [];
    for (const [name, entry] of this.processes) {
      models.push({
        name,
        status: entry.status,
        uptime: Date.now() - entry.startTime,
      });
    }
    
    return models;
  }

  /**
   * Subscribe with React 19-inspired notification patterns
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Update process status with optimistic handling
   */
  _updateProcessStatus(modelName, status) {
    const event = {
      type: 'model:status',
      modelName,
      status,
      timestamp: Date.now(),
    };

    // Non-reactive logic handling (useEffectEvent pattern)
    const notifySubscribers = () => {
      for (const subscriber of this.subscribers) {
        try {
          subscriber(event);
        } catch (error) {
          console.error('Subscriber error:', error);
        }
      }
    };

    // Optimistic update approach - immediate change in state
    const entry = this.processes.get(modelName);
    if (entry) {
      entry.status = status;
    }

    notifySubscribers();
  }

  /**
   * Check if model is running with optimistic pattern
   */
  isRunning(modelName) {
    const entry = this.processes.get(modelName);
    return entry && entry.status === 'running';
  }

  /**
   * Get running count with React 19-inspired handling
   */
  getRunningCount() {
    let count = 0;
    for (const entry of this.processes.values()) {
      if (entry.status === 'running') {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Get all status with React 19-inspired patterns
   */
  getAllStatus() {
    const status = {};
    for (const [name, entry] of this.processes) {
      status[name] = entry.status;
    }
    
    return status;
  }

  /**
   * Cache signal creation pattern for automatic cleanup
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

module.exports = LlamaServerService;