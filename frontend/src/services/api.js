import axios from 'axios';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Monitoring
  getMetrics: () => apiClient.get('/monitoring'),
  
  // Models
  getModels: () => apiClient.get('/models'),
  startModel: (modelName) => apiClient.post(`/models/${modelName}/start`),
  stopModel: (modelName) => apiClient.post(`/models/${modelName}/stop`),
  getModelDetails: (modelName) => apiClient.get(`/models/${modelName}`),
  
  // Configuration
  getConfig: () => apiClient.get('/config'),
  updateConfig: (config) => apiClient.post('/config', config),
  getModelConfig: (modelName) => apiClient.get(`/config/models/${modelName}`),
  updateModelConfig: (modelName, config) =>
    apiClient.post(`/config/models/${modelName}`, config),
  
  // Paths
  getModelPaths: () => apiClient.get('/paths/models'),
  setModelsPath: (path) => apiClient.post('/paths/models', { path }),
  discoverModels: (path) => apiClient.post('/paths/discover', { path }),
  
  // Proxies
  getProxyStatus: (proxyName) => apiClient.get(`/proxies/${proxyName}/status`),
  
  // Logs
  getLogs: (limit = 100, offset = 0) =>
    apiClient.get(`/logs?limit=${limit}&offset=${offset}`),
  clearLogs: () => apiClient.post('/logs/clear'),
  
  // Health
  getHealth: () => apiClient.get('/health'),
};

export default api;
