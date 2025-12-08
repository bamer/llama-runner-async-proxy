import io from 'socket.io-client';
import { useMetricsStore, useModelsStore, useAlertsStore, useLogsStore } from '../store';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        this.socket = io(`${wsProtocol}//${host}`, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('metrics:update', (data) => {
          useMetricsStore.getState().updateMetrics(data);
        });

        this.socket.on('models:status', (data) => {
          useModelsStore.getState().updateModels(data.models || []);
        });

        this.socket.on('alert:new', (alert) => {
          useAlertsStore.getState().addAlert(alert);
        });

        this.socket.on('logs:update', (log) => {
          useLogsStore.getState().addLog(log);
        });

        this.socket.on('logs:history', (logs) => {
          useLogsStore.getState().setLogs(logs);
        });

        this.socket.on('logs:stats', (stats) => {
          useLogsStore.getState().setStats(stats);
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          this.reconnectAttempts++;
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const wsService = new WebSocketService();
