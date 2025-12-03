import { create } from 'zustand';

export const useMetricsStore = create((set, get) => ({
  metrics: {
    cpu: { percent: 0, cores: [] },
    memory: { used: 0, total: 0, percent: 0 },
    disk: { used: 0, total: 0, percent: 0 },
    network: { in: 0, out: 0 },
    gpu: { usage: 0, memory: 0 },
  },
  metricsHistory: [],
  maxHistoryPoints: 60,
  
  updateMetrics: (newMetrics) => {
    set((state) => {
      const history = [
        ...state.metricsHistory.slice(-state.maxHistoryPoints + 1),
        {
          ...newMetrics,
          timestamp: Date.now(),
        },
      ];
      
      return {
        metrics: newMetrics,
        metricsHistory: history,
      };
    });
  },
  
  clearHistory: () => set({ metricsHistory: [] }),
  setMaxHistoryPoints: (max) => set({ maxHistoryPoints: max }),
}));

export const useModelsStore = create((set) => ({
  models: [],
  selectedModel: null,
  
  updateModels: (models) => set({ models }),
  selectModel: (model) => set({ selectedModel: model }),
  
  updateModelStatus: (modelName, status) =>
    set((state) => ({
      models: state.models.map((m) =>
        m.name === modelName ? { ...m, ...status } : m
      ),
    })),
}));

export const useConfigStore = create((set) => ({
  config: null,
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,
  
  setConfig: (config) => set({ config, hasUnsavedChanges: false }),
  updateConfig: (updates) =>
    set((state) => ({
      config: { ...state.config, ...updates },
      hasUnsavedChanges: true,
    })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

export const useAlertsStore = create((set) => ({
  alerts: [],
  
  addAlert: (alert) =>
    set((state) => ({
      alerts: [
        ...state.alerts,
        {
          id: Date.now(),
          timestamp: new Date(),
          ...alert,
        },
      ].slice(-50), // Keep last 50 alerts
    })),
    
  dismissAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    })),
    
  clearAlerts: () => set({ alerts: [] }),
}));

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',
  
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return { theme: newTheme };
    }),
    
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
}));

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeTab: 'dashboard',
  
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export const useLogsStore = create((set) => ({
  logs: [],
  stats: { total: 0, info: 0, warn: 0, error: 0 },
  filter: { level: null, search: '' },
  
  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs.slice(-999), log],
    })),
  
  setLogs: (logs) => set({ logs }),
  
  clearLogs: () => set({ logs: [] }),
  
  setStats: (stats) => set({ stats }),
  
  setFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, ...filter },
    })),
    
  getFilteredLogs: (state) => {
    let filtered = state.logs;
    
    if (state.filter.level) {
      filtered = filtered.filter(log => log.level === state.filter.level);
    }
    if (state.filter.search) {
      const searchLower = state.filter.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  },
}));
