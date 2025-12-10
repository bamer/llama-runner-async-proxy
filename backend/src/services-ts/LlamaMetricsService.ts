import { EventEmitter } from 'events';
import axios from 'axios';

export interface ModelMetrics {
  llama: {
    tokensGenerated: number;
    contextUsed: number;
    tokenSpeedAvg: number;
    contextSize: number;
    contextUsedPercent?: number;
  };
  slots: {
    total: number;
    busy: number;
    idle: number;
    processing: number;
  };
  tokens: {
    predicted: number;
    evaluationTimings: number;
  };
  timestamp: number;
}

export interface ModelMetricsData {
  host: string;
  port: number;
  url: string;
  status: string;
  lastUpdate?: Date;
  metrics: ModelMetrics;
}

export class LlamaMetricsService extends EventEmitter {
  private modelMetrics: Map<string, ModelMetricsData>;
  private metricsHistory: Map<string, ModelMetrics[]>;
  private pollingIntervals: Map<string, NodeJS.Timeout>;
  private maxHistorySize: number;

  constructor() {
    super();
    this.modelMetrics = new Map(); // modelName -> { host, port, metrics }
    this.metricsHistory = new Map(); // modelName -> array of timestamped metrics
    this.pollingIntervals = new Map(); // modelName -> intervalId
    this.maxHistorySize = 300; // Garder 5 min de données (1 point par sec)
  }

  /**
   * Enregistrer un modèle à monitorer
   */
  registerModel(modelName: string, host: string, port: number): void {
    const key = `${host}:${port}`;
    this.modelMetrics.set(modelName, {
      host,
      port,
      url: `http://${host}:${port}/metrics`,
      status: 'starting',
      lastUpdate: null,
      metrics: {
        llama: {
          tokensGenerated: 0,
          contextUsed: 0,
          tokenSpeedAvg: 0,
          contextSize: 0
        },
        slots: {
          total: 0,
          busy: 0,
          idle: 0,
          processing: 0
        },
        tokens: {
          predicted: 0,
          evaluationTimings: 0
        },
        timestamp: Date.now()
      }
    });
    this.metricsHistory.set(modelName, []);
    console.log(`📊 Registered metrics for ${modelName} on ${key}`);
  }

  /**
   * Démarrer le polling des métriques pour un modèle
   */
  startPolling(modelName: string, pollInterval = 1000): void {
    if (this.pollingIntervals.has(modelName)) {
      clearInterval(this.pollingIntervals.get(modelName)!);
    }

    const intervalId = setInterval(async () => {
      await this._collectMetrics(modelName);
    }, pollInterval);

    this.pollingIntervals.set(modelName, intervalId);
    console.log(`⏱️ Started polling metrics for ${modelName} (${pollInterval}ms)`);
  }

  /**
   * Arrêter le polling pour un modèle
   */
  stopPolling(modelName: string): void {
    if (this.pollingIntervals.has(modelName)) {
      clearInterval(this.pollingIntervals.get(modelName)!);
      this.pollingIntervals.delete(modelName);
      console.log(`⏹️ Stopped polling for ${modelName}`);
    }
  }

  /**
   * Collecter les vraies métriques de llama-server
   */
  async _collectMetrics(modelName: string): Promise<void> {
    const modelData = this.modelMetrics.get(modelName);
    if (!modelData) return;

    try {
      const response = await axios.get(modelData.url, { timeout: 3000 });
      const metricsText = response.data;
      
      // Parser les métriques Prometheus
      const metrics = this._parsePrometheusMetrics(metricsText);
      
      modelData.metrics = {
        ...metrics,
        timestamp: Date.now(),
      };
      modelData.status = 'running';
      modelData.lastUpdate = new Date();
      
      // Ajouter à l'historique
      const history = this.metricsHistory.get(modelName) || [];
      history.push(modelData.metrics);
      
      // Garder seulement les dernières N entrées
      if (history.length > this.maxHistorySize) {
        history.shift();
      }
      this.metricsHistory.set(modelName, history);
      
      // Émettre l'événement pour WebSocket
      this.emit('metrics-update', {
        modelName,
        metrics: modelData.metrics,
        history: history.slice(-60), // Dernière minute
      });
      
    } catch (error) {
      modelData.status = 'error';
      modelData.metrics = {
        llama: {
          tokensGenerated: 0,
          contextUsed: 0,
          tokenSpeedAvg: 0,
          contextSize: 0
        },
        slots: {
          total: 0,
          busy: 0,
          idle: 0,
          processing: 0
        },
        tokens: {
          predicted: 0,
          evaluationTimings: 0
        },
        timestamp: Date.now()
      };
    }
  }

  /**
   * Parser les métriques au format Prometheus (texte)
   * Format : # HELP nom Description
   *          # TYPE nom type
   *          nom{labels} valeur
   */
  _parsePrometheusMetrics(metricsText: string): ModelMetrics {
    const metrics: ModelMetrics = {
      llama: {
        tokensGenerated: 0,
        contextUsed: 0,
        tokenSpeedAvg: 0,
        contextSize: 0
      },
      slots: {
        total: 0,
        busy: 0,
        idle: 0,
        processing: 0
      },
      tokens: {
        predicted: 0,
        evaluationTimings: 0
      },
      timestamp: Date.now()
    };

    const lines = metricsText.split('\n');
    
    for (const line of lines) {
      // Ignorer les commentaires et lignes vides
      if (line.startsWith('#') || !line.trim()) continue;

      // Parser la ligne métrique
      const match = line.match(/^([\w:]+)(?:\{[^}]*\})?[\s]+(.+)$/);
      if (!match) continue;

      const [, metricName, value] = match;
      const numValue = parseFloat(value);

      // Mapper les métriques importantes
      if (metricName === 'llamacpp_slot_tokens_generated') {
        metrics.llama.tokensGenerated = numValue;
      } else if (metricName === 'llamacpp_slot_context_used') {
        metrics.llama.contextUsed = numValue;
      } else if (metricName === 'llamacpp_slot_context_size') {
        metrics.llama.contextSize = numValue;
      } else if (metricName === 'llamacpp_slot_timings_processing') {
        metrics.tokens.evaluationTimings = numValue;
      } else if (metricName === 'llamacpp_slots_busy') {
        metrics.slots.busy = numValue;
      } else if (metricName === 'llamacpp_slots_idle') {
        metrics.slots.idle = numValue;
      } else if (metricName === 'llamacpp_tokens_predicted') {
        metrics.tokens.predicted = numValue;
      }
    }

    // Calculer les métriques dérivées
    if (metrics.llama.contextSize > 0) {
      metrics.llama.contextUsedPercent = 
        (metrics.llama.contextUsed / metrics.llama.contextSize * 100).toFixed(2);
    }
    metrics.slots.total = metrics.slots.busy + metrics.slots.idle;

    return metrics;
  }

  /**
   * Obtenir les dernières métriques d'un modèle
   */
  getMetrics(modelName: string): ModelMetrics | null {
    const modelData = this.modelMetrics.get(modelName);
    return modelData ? modelData.metrics : null;
  }

  /**
   * Obtenir l'historique des métriques
   */
  getHistory(modelName: string, limit = 60): ModelMetrics[] {
    const history = this.metricsHistory.get(modelName) || [];
    return history.slice(-limit);
  }

  /**
   * Obtenir le statut du modèle
   */
  getStatus(modelName: string): string {
    const modelData = this.modelMetrics.get(modelName);
    return modelData ? modelData.status : 'unknown';
  }

  /**
   * Obtenir l'état de tous les modèles monitorés
   */
  getAllModelsStatus(): Record<string, { status: string; lastUpdate?: Date; metrics: ModelMetrics }> {
    const status: Record<string, { status: string; lastUpdate?: Date; metrics: ModelMetrics }> = {};
    for (const [name, data] of this.modelMetrics) {
      status[name] = {
        status: data.status,
        lastUpdate: data.lastUpdate,
        metrics: data.metrics
      };
    }
    return status;
  }

  /**
   * Désinscrire complètement un modèle
   */
  unregisterModel(modelName: string): void {
    this.stopPolling(modelName);
    this.modelMetrics.delete(modelName);
    this.metricsHistory.delete(modelName);
    console.log(`🗑️ Unregistered metrics for ${modelName}`);
  }

  /**
   * Nettoyer les ressources
   */
  destroy(): void {
    for (const [name] of this.modelMetrics) {
      this.stopPolling(name);
    }
    this.modelMetrics.clear();
    this.metricsHistory.clear();
    this.removeAllListeners();
  }
}