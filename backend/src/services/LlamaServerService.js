const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class LlamaServerService {
  constructor() {
    this.processes = new Map(); // modelName -> { process, config, status }
    this.subscribers = new Set();
  }

  /**
   * Construire la commande llama-server avec les paramètres
   */
  buildCommand(modelPath, config) {
    const params = [];

    // Modèle et contexte
    params.push(`-m ${modelPath}`);
    
    // Répertoire des modèles (pour les projections mmproj, etc.)
    if (config.models_dir && fs.existsSync(config.models_dir)) {
      params.push(`--models-dir "${config.models_dir}"`);
    }
    
    params.push(`-c ${config.ctx_size || 4096}`);
    params.push(`-b ${config.batch_size || 2048}`);
    params.push(`-ub ${config.ubatch_size || 512}`);
    // Multimodal (mmproj pour vision/audio)
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

    // Performance et GPU
    if (config.gpu_layers !== undefined) {
      params.push(`-ngl ${config.gpu_layers}`);
    }
    if (config.threads) {
      params.push(`-t ${config.threads}`);
    }
    if (config.thread_batch) {
      params.push(`-tb ${config.thread_batch}`);
    }

    // Mémoire et optimisations
    if (config.mlock) params.push('--mlock');
    if (!config.mmap) params.push('--no-mmap');
    if (config.flash_attn) params.push('-fa');
    if (config.numa) params.push('--numa');
    if (config.simple_io) params.push('--simple-io');

    // Serveur
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
   * Démarrer un modèle
   */
  async startModel(modelName, config) {
    if (this.processes.has(modelName)) {
      throw new Error(`Model ${modelName} is already running`);
    }

    if (!fs.existsSync(config.path)) {
      throw new Error(`Model file not found: ${config.path}`);
    }

    try {
      const runtime = '/home/bamer/llama.cpp/build/bin/llama-server'; // À configurer
      const args = this.buildCommand(config.path, config).split(' ');

      console.log(`🚀 Starting model: ${modelName}`);
      console.log(`   Command: ${runtime} ${args.join(' ')}`);

      const process = spawn(runtime, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('listening')) {
          this._updateProcessStatus(modelName, 'running');
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

      this.processes.set(modelName, {
        process,
        config,
        status: 'starting',
        startTime: Date.now(),
      });

      this._updateProcessStatus(modelName, 'starting');
      return { success: true, modelName, pid: process.pid };
    } catch (error) {
      console.error(`Failed to start model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Arrêter un modèle
   */
  stopModel(modelName) {
    const entry = this.processes.get(modelName);
    if (!entry) {
      throw new Error(`Model ${modelName} is not running`);
    }

    try {
      console.log(`⏹️ Stopping model: ${modelName}`);
      entry.process.kill('SIGTERM');

      // Forcer kill après 5 secondes
      const timeout = setTimeout(() => {
        entry.process.kill('SIGKILL');
      }, 5000);

      entry.process.once('exit', () => clearTimeout(timeout));

      this._updateProcessStatus(modelName, 'stopping');
      return { success: true, modelName };
    } catch (error) {
      console.error(`Failed to stop model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir l'état d'un modèle
   */
  getModelStatus(modelName) {
    const entry = this.processes.get(modelName);
    if (!entry) {
      return { modelName, status: 'stopped' };
    }

    return {
      modelName,
      status: entry.status,
      pid: entry.process.pid,
      uptime: Date.now() - entry.startTime,
      config: entry.config,
    };
  }

  /**
   * Obtenir tous les modèles en cours d'exécution
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
   * S'abonner aux mises à jour
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Mettre à jour et notifier
   */
  _updateProcessStatus(modelName, status) {
    const event = {
      type: 'model:status',
      modelName,
      status,
      timestamp: Date.now(),
    };

    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    }
  }
}

module.exports = LlamaServerService;
