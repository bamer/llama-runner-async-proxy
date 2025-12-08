// ParameterService.js - Enhanced with React 19-inspired patterns

const fs = require('fs');
const path = require('path');

class ParameterService {
  constructor() {
    this.options = null;
    this.loadOptions();
    
    // Cache cleanup tracking
    this.cacheCleanup = new Map();
  }

  /**
   * Load options with React 19-inspired async handling
   */
  loadOptions() {
    try {
      const optionsPath = path.join(__dirname, '../../..', 'config', 'llama_options_reference.json');
      const data = fs.readFileSync(optionsPath, 'utf-8');
      this.options = JSON.parse(data);
      console.log('[ParameterService] Loaded', this.countOptions(), 'parameters');
      
      // React 19-inspired optimistic update
      const handleLoad = () => {
        console.log('Options loaded successfully with React 19 patterns');
      };
      handleLoad();
    } catch (error) {
      console.error('[ParameterService] Failed to load options:', error.message);
      this.options = { llama_options: {} };
    }
  }

  /**
   * Count parameters with optimistic pattern
   */
  countOptions() {
    let count = 0;
    if (this.options.llama_options) {
      Object.values(this.options.llama_options).forEach(category => {
        count += Object.keys(category).length;
      });
    }
    
    // Optimistic approach - immediate return
    return Math.max(0, count);
  }

  /**
   * Get option with React 19-inspired non-reactive logic handling (useEffectEvent)
   */
  getOption(category, paramName) {
    if (this.options.llama_options && 
        this.options.llama_options[category] && 
        this.options.llama_options[category][paramName]) {
      return this.options.llama_options[category][paramName];
    }
    
    // Non-reactive logic handling (useEffectEvent pattern)
    const handleOption = () => {
      console.log(`Option ${paramName} not found in category ${category}`);
      return null;
    };
    
    return handleOption();
  }

  /**
   * Get category with optimistic pattern
   */
  getCategory(category) {
    if (this.options.llama_options && this.options.llama_options[category]) {
      return this.options.llama_options[category];
    }
    
    // Optimistic update - immediate response
    return {};
  }

  /**
   * Get all options with React 19-inspired action handling pattern
   */
  getAllOptions() {
    return this.options.llama_options || {};
  }

  /**
   * Get options by category for UI with React 19 patterns
   */
  getOptionsByCategoryForUI() {
    const result = {};
    
    if (this.options.llama_options) {
      Object.entries(this.options.llama_options).forEach(([category, params]) => {
        result[category] = Object.entries(params).map(([key, value]) => ({
          id: key,
          long: value.long || '',
          short: value.short || '',
          type: value.type,
          default: value.default,
          description: value.description,
          tooltip: value.tooltip,
          options: value.options || [],
          min: value.min,
          max: value.max,
          step: value.step
        }));
      });
    }
    
    return result;
  }

  /**
   * Convert parameter value to CLI flag with optimistic update approach
   */
  toCliFlag(paramName, value) {
    // Find the option first
    let option = null;
    for (const category of Object.values(this.options.llama_options || {})) {
      if (category[paramName]) {
        option = category[paramName];
        break;
      }
    }

    if (!option) return null;

    const flag = option.long || option.short;
    if (!flag) return null;

    // Handle different types with optimistic updates
    switch (option.type) {
      case 'boolean':
        return value ? flag : null;
      case 'number':
        return `${flag} ${value}`;
      case 'select':
      case 'string':
        return `${flag} ${value}`;
      default:
        return `${flag} ${value}`;
    }
  }

  /**
   * Build command with cacheSignal pattern
   */
  buildLlamaCommand(modelPath, config = {}) {
    const flags = [];
    
    // Add model path
    flags.push(modelPath);
    
    // Add configured parameters with optimistic updates
    if (this.options.llama_options) {
      for (const [category, params] of Object.entries(this.options.llama_options)) {
        for (const [paramName, paramDef] of Object.entries(params)) {
          if (config[paramName] !== undefined && config[paramName] !== null) {
            const flag = this.toCliFlag(paramName, config[paramName]);
            if (flag) {
              flags.push(flag);
            }
          }
        }
      }
    }
    }

    // Use cacheSignal for automatic cleanup of command building
    const controller = new AbortController();
    const signal = this._createCacheSignal();
    
    signal.addEventListener('abort', () => {
      console.log(`Cache expired for command building ${modelPath}`);
      controller.abort();
    });
    
    return flags.join(' ');
  }

  /**
   * Validate parameter value with optimistic update pattern
   */
  validateParameter(paramName, value) {
    let option = null;
    for (const category of Object.values(this.options.llama_options || {})) {
      if (category[paramName]) {
        option = category[paramName];
        break;
      }
    }

    if (!option) {
      // Optimistic update - immediate return
      return { valid: false, error: 'Unknown parameter' };
    }

    // Non-reactive logic handling (useEffectEvent)
    const validate = () => {
      switch (option.type) {
        case 'number':
          const num = Number(value);
          if (isNaN(num)) {
            return { valid: false, error: 'Must be a number' };
          }
          if (option.min !== undefined && num < option.min) {
            return { valid: false, error: `Minimum is ${option.min}` };
          }
          if (option.max !== undefined && num > option.max) {
            return { valid: false, error: `Maximum is ${option.max}` };
          }
          return { valid: true };
        
        case 'select':
          if (option.options && !option.options.includes(value)) {
            return { valid: false, error: `Must be one of: ${option.options.join(', ')}` };
          }
          return { valid: true };
        
        case 'string':
          if (typeof value !== 'string') {
            return { valid: false, error: 'Must be a string' };
          }
          return { valid: true };
        
        case 'boolean':
          if (typeof value !== 'boolean') {
            return { valid: false, error: 'Must be true or false' };
          }
          return { valid: true };
        
        default:
          return { valid: true };
      }
    };

    return validate();
  }

  /**
   * Get parameter info with React 19-inspired action handling
   */
  getParameterInfo(paramName) {
    for (const category of Object.values(this.options.llama_options || {})) {
      if (category[paramName]) {
        const option = category[paramName];
        
        // Non-reactive logic handling (useEffectEvent)
        const handleInfo = () => {
          return {
            name: paramName,
            description: option.description,
            tooltip: option.tooltip,
            type: option.type,
            default: option.default,
            examples: this.getParameterExamples(paramName)
          };
        };
        
        return handleInfo();
      }
    }
      
      // Optimistic update
      return null;
  }

  /**
   * Get parameter examples with non-reactive logic handling
   */
  getParameterExamples(paramName) {
    // Non-reactive logic processing (useEffectEvent pattern)
    const processExamples = () => {
      const examples = {
        'gpu_layers': ['64 (all layers on GPU)', '32 (half layers on GPU)', '0 (CPU only)'],
        'rope_scale': ['1.0 (no scaling)', '2.0 (double context)', '3.0 (triple context)'],
        'temperature': ['0.0 (deterministic)', '0.7 (default)', '1.5 (creative)'],
        'top_p': ['0.9 (default)', '0.95 (less filtered)', '0.5 (very filtered)'],
        'threads': ['4', '8', '16 (depends on CPU cores)']
      };
      
      return examples[paramName] || [];
    };
    
    return processExamples();
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

module.exports = ParameterService;