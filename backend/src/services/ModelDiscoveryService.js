const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

class ModelDiscoveryService {
  constructor() {
    this.supportedFormats = ['.gguf', '.bin', '.safetensors', '.pt'];
    this.cache = new Map();
  }

  /**
   * Scan un répertoire récursivement pour trouver des modèles
   */
  async discoverModels(basePath, maxDepth = 3) {
    console.log(`🔍 Scanning for models in: ${basePath}`);

    if (!fs.existsSync(basePath)) {
      throw new Error(`Path does not exist: ${basePath}`);
    }

    const models = [];
    await this._scanDirectory(basePath, models, 0, maxDepth);

    // Associer les mmproj aux modèles principaux
    this._associateMultimodal(models);

    console.log(`✅ Found ${models.length} model(s)`);
    return models;
  }

  /**
   * Associer les fichiers mmproj aux modèles principaux
   */
  _associateMultimodal(models) {
    // Créer une map de mmproj par répertoire parent
    const mmprojs = {};
    const mainModels = [];

    for (const model of models) {
      if (model.filename.includes('mmproj')) {
        const dir = path.dirname(model.path);
        if (!mmprojs[dir]) mmprojs[dir] = [];
        mmprojs[dir].push(model);
        console.log(`📹 Found multimodal projection: ${model.name}`);
      } else {
        mainModels.push(model);
      }
    }

    // Associer les mmproj aux modèles principaux du même répertoire
    for (const model of mainModels) {
      const dir = path.dirname(model.path);
      if (mmprojs[dir]) {
        model.multimodal = mmprojs[dir];
        console.log(`🔗 Associated multimodal projections to ${model.name}`);
      }
    }

    // Retirer les mmproj de la liste principale (seuls les main models restent)
    models.length = 0;
    models.push(...mainModels);
  }

  /**
   * Scan récursif d'un répertoire
   */
  async _scanDirectory(dir, models, currentDepth, maxDepth) {
    if (currentDepth > maxDepth) return;

    try {
      const files = await readdirAsync(dir);

      for (const file of files) {
        try {
          const filePath = path.join(dir, file);
          const stat = await statAsync(filePath);

          if (stat.isDirectory()) {
            // Scan les sous-répertoires
            await this._scanDirectory(filePath, models, currentDepth + 1, maxDepth);
          } else if (stat.isFile()) {
            // Vérifier si c'est un format supporté
            const ext = path.extname(file).toLowerCase();
            if (this.supportedFormats.includes(ext)) {
              const modelInfo = {
                name: path.basename(file, ext),
                path: filePath,
                filename: file,
                format: ext.substring(1), // 'gguf', 'bin', etc.
                size: stat.size,
                sizeGB: (stat.size / (1024 ** 3)).toFixed(2),
                mtime: stat.mtime,
                status: 'discovered',
              };

              // Essayer d'extraire les métadonnées
              if (ext === '.gguf') {
                try {
                  const metadata = await this._extractGGUFMetadata(filePath);
                  modelInfo.metadata = metadata;
                } catch (e) {
                  console.warn(`Could not extract metadata from ${file}:`, e.message);
                }
              }

              models.push(modelInfo);
              console.log(`  📦 Found model: ${modelInfo.name} (${modelInfo.sizeGB} GB)`);
            }
          }
        } catch (error) {
          console.warn(`Error processing ${filePath}:`, error.message);
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${dir}:`, error.message);
    }
  }

  /**
   * Extraire les métadonnées GGUF (format simple)
   */
  async _extractGGUFMetadata(filePath) {
    try {
      // Lire les premiers bytes pour extraire les métadonnées GGUF
      // Format simplifié - dans la pratique, utiliser une lib GGUF
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(512);
      fs.readSync(fd, buffer, 0, 512);
      fs.closeSync(fd);

      // Chercher des patterns communs dans les métadonnées
      const str = buffer.toString('latin1');

      const metadata = {
        hasContextLength: str.includes('context_length'),
        hasAttention: str.includes('attention'),
        hasFlashAttention: str.includes('flash'),
      };

      return metadata;
    } catch (error) {
      return {};
    }
  }

  /**
   * Charger la configuration d'un modèle depuis le fichier
   */
  loadModelConfig(modelsConfig, modelName) {
    if (modelsConfig.models && modelsConfig.models[modelName]) {
      return modelsConfig.models[modelName];
    }
    return null;
  }

  /**
   * Sauvegarder la configuration d'un modèle
   */
  saveModelConfig(modelsConfigPath, modelName, config) {
    try {
      const modelsConfig = JSON.parse(fs.readFileSync(modelsConfigPath, 'utf8'));

      if (!modelsConfig.models) {
        modelsConfig.models = {};
      }

      modelsConfig.models[modelName] = {
        ...config,
        saved_at: new Date().toISOString(),
      };

      fs.writeFileSync(modelsConfigPath, JSON.stringify(modelsConfig, null, 2));
      console.log(`✅ Saved config for model: ${modelName}`);
      return true;
    } catch (error) {
      console.error(`❌ Error saving model config:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les paramètres par défaut avec tous les options
   */
      getDefaultParameters() {
    return {
      // Paramètres de contexte
      ctx_size: 4096,
      batch_size: 2048,
      ubatch_size: 512,
      // Répertoire des modèles
      models_dir: '',
      // Paramètres multimodal/Vision/Audio
      multimodal_enabled: false,
      mmproj_path: '',
      enable_vision: false,
      enable_audio: false,
      image_batch_size: 512,
      audio_batch_size: 512,

      // Paramètres génération
      temp: 0.7,
      top_k: 40,
      top_p: 0.9,
      min_p: 0.0,
      repeat_penalty: 1.1,
      presence_penalty: 0.0,
      frequency_penalty: 0.0,
      mirostat: 0,
      mirostat_tau: 5.0,
      mirostat_eta: 0.1,

      // Tensor Shaping & Optimisation
      ts_enabled: false,
      ts_rows: '22,78',
      ts_base: 10000,
      cache_reuse: 0,

      // Performance & Optimisation
      threads: 8,
      thread_batch: 512,
      gpu_layers: 35,
      main_gpu: 0,
      tensor_split: [],
      parallel: 1,
      n_cpu_moe: 0,

      // Mémoire
      mlock: false,
      mmap: true,
      no_mmap: false,
      numa: false,

      // Attention & Optimisations
      flash_attn: false,
      no_kv_offload: false,
      simple_io: false,
      kv_unified: false,
      no_warmup: false,

      // Chiffrement & Sécurité
      use_mmap: true,
      use_mlock: false,

      // CPU MOE (Mixture of Experts)
      cpu_moe: false,

      // Serveur
      host: '127.0.0.1',
      port: 8000,
      n_parallel: 1,
      n_sequences: 1,
      timeout: 600000,

      // Jinja & Templates
      jinja: false,

      // Alias
      alias: '',

      // Logging
      log_all: false,
      verbose: false,
      log_colors: false,

      // CUDA
      cuda_device: '',

      // GGML Options
      ggml_cuda_enable_unified_memory: false,

      // NUMA (Non-Uniform Memory Architecture)
      numa_affinity: false,
    };
  }

  /**
   * Valider la configuration d'un modèle
   */
  validateModelConfig(config) {
    const errors = [];

    if (!config.path) errors.push('Model path is required');
    if (!fs.existsSync(config.path)) errors.push(`Model file not found: ${config.path}`);
    if (!config.name) errors.push('Model name is required');

    if (config.models_dir && !fs.existsSync(config.models_dir)) {
      errors.push(`Models directory not found: ${config.models_dir}`);
    }

    if (config.ctx_size && (config.ctx_size < 128 || config.ctx_size > 2000000)) {
      errors.push('Context size should be between 128 and 2000000');
    }

    if (config.temp && (config.temp < 0 || config.temp > 2)) {
      errors.push('Temperature should be between 0 and 2');
    }

    if (config.top_k && config.top_k < 0) {
      errors.push('Top K should be >= 0');
    }

    if (config.top_p && (config.top_p < 0 || config.top_p > 1)) {
      errors.push('Top P should be between 0 and 1');
    }

    if (config.threads && (config.threads < 1 || config.threads > 512)) {
      errors.push('Threads should be between 1 and 512');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = ModelDiscoveryService;
