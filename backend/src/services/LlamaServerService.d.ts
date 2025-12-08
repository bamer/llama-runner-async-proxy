// TypeScript definitions for Backend Services - React 19 Features

export interface ModelProcess {
  process: any; // ChildProcess
  config: any;
  status: string;
  startTime: number;
}

export interface ProcessStatus {
  modelName: string;
  status: string;
  pid?: number;
  uptime?: number;
  config?: any;
}

export interface ModelStats {
  name: string;
  status: string;
  startTime?: number;
  requestCount: number;
  errorCount: number;
  totalLatency: number;
}

export interface MetricsData {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  timestamp: number;
}

export interface CacheSignal {
  addEventListener: (event: string, handler: Function) => void;
  removeEventListener: (event: string) => void;
  abort: () => void;
}

// LlamaServerService interface
export interface LlamaServerServiceInterface {
  processes: Map<string, ModelProcess>;
  subscribers: Set<Function>;
  cacheCleanup: Map<string, Function>;

  buildCommand(modelPath: string, config: any): string;
  startModel(modelName: string, config: any): Promise<any>;
  stopModel(modelName: string): Promise<any>;
  getModelStatus(modelName: string): ProcessStatus;
  getAllRunningModels(): Array<any>;
  subscribe(callback: Function): () => void;
  _updateProcessStatus(modelName: string, status: string): void;
  isRunning(modelName: string): boolean;
  getRunningCount(): number;
  getAllStatus(): any;
  _createCacheSignal(): CacheSignal;
  static createCachedResource(key: string, resourceFunction: Function): any;
}

// ParameterService interface
export interface ParameterServiceInterface {
  options: any;
  cacheCleanup: Map<string, Function>;

  loadOptions(): void;
  countOptions(): number;
  getOption(category: string, paramName: string): any;
  getCategory(category: string): any;
  getAllOptions(): any;
  getOptionsByCategoryForUI(): any;
  toCliFlag(paramName: string, value: any): string | null;
  buildLlamaCommand(modelPath: string, config?: any): string;
  validateParameter(paramName: string, value: any): any;
  getParameterInfo(paramName: string): any;
  getParameterExamples(paramName: string): Array<string>;
  _createCacheSignal(): CacheSignal;
  static createCachedResource(key: string, resourceFunction: Function): any;
}

// MetricsService interface
export interface MetricsServiceInterface {
  monitor: any;
  isCollecting: boolean;
  interval: any;
  updateInterval: number;
  subscribers: Set<Function>;
  metricsHistory: Array<any>;
  maxHistory: number;
  models: any;
  collectionQueue: Array<Function>;
  cacheCleanup: Map<string, Function>;

  start(): void;
  stop(): void;
  collect(): Promise<void>;
  subscribe(callback: Function): () => void;
  notifySubscribers(event: any): void;
  getMetrics(): MetricsData;
  getMetricsHistory(limit?: number): Array<any>;
  registerModel(modelName: string, data: any): void;
  updateModelStatus(modelName: string, status: string): void;
  recordModelRequest(modelName: string, latency: number, success?: boolean): boolean;
  getModelStats(modelName: string): ModelStats | null;
  getAllModels(): Array<any>;
  clearHistory(): void;
  setUpdateInterval(interval: number): void;
  _createCacheSignal(): CacheSignal;
  static createCachedResource(key: string, resourceFunction: Function): any;
}