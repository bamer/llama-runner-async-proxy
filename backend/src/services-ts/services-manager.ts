import { LlamaServerService } from './LlamaServerService';
import { MetricsService } from './MetricsService';
import { LogService } from './LogService';
import { LlamaMetricsService } from './LlamaMetricsService';
import { ModelDiscoveryService } from './ModelDiscoveryService';
import { BackupService } from './BackupService';
import { ParameterService } from './ParameterService';

export class ServicesManager {
  private static instance: ServicesManager;
  private services: Map<string, any>;

  constructor() {
    this.services = new Map();
    
    // Initialize all services
    this.services.set('LlamaServerService', new LlamaServerService());
    this.services.set('MetricsService', new MetricsService());
    this.services.set('LogService', new LogService());
    this.services.set('LlamaMetricsService', new LlamaMetricsService());
    this.services.set('ModelDiscoveryService', new ModelDiscoveryService());
    this.services.set('BackupService', new BackupService());
    this.services.set('ParameterService', new ParameterService());
  }

  static getInstance(): ServicesManager {
    if (!ServicesManager.instance) {
      ServicesManager.instance = new ServicesManager();
    }
    return ServicesManager.instance;
  }

  get<T>(name: string): T | null {
    return this.services.get(name) || null;
  }

  getAll(): Map<string, any> {
    return this.services;
  }
}