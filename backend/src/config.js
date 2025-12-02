// backend/src/config.js
const fs = require('fs');
const path = require('path');

// Load app configuration
function loadConfig() {
    try {
        const configPath = path.join(__dirname, '../config/app_config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error loading app config:', error);
        // Return default configuration
        return {
            proxies: {
                ollama: { enabled: true, port: 11434 },
                lmstudio: { enabled: true, port: 1234, api_key: null }
            },
            webui: { enabled: true, port: 8081, host: "0.0.0.0" },
            concurrentRunners: 1,
            logging: { prompt_logging_enabled: false }
        };
    }
}

// Load models configuration
function loadModelsConfig() {
    try {
        const configPath = path.join(__dirname, '../config/models_config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error loading models config:', error);
        // Return default configuration
        return {
            default_parameters: {
                ctx_size: 32000,
                temp: 0.7,
                batch_size: 1024,
                ubatch_size: 512,
                threads: 10,
                mlock: true,
                no_mmap: true,
                flash_attn: "on",
                port: 8000,
                host: "127.0.0.1"
            },
            runtimes: {
                "llama-server": {
                    runtime: "F:/llm/llama/llama-server.exe",
                    supports_tools: true
                }
            },
            models: {},
            default_model: null
        };
    }
}

module.exports = { loadConfig, loadModelsConfig };