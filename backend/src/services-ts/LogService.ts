import { EventEmitter } from 'events';

export interface LogEntry {
  level: string;
  message: string;
  timestamp: number;
  iso: string;
}

export class LogService extends EventEmitter {
  private subscribers: Set<(log: LogEntry) => void>;
  private maxLogs: number;
  private logs: LogEntry[];
  private originalLog: (message?: any, ...optionalParams: any[]) => void;
  private originalError: (message?: any, ...optionalParams: any[]) => void;
  private originalWarn: (message?: any, ...optionalParams: any[]) => void;

  constructor() {
    super();
    this.subscribers = new Set();
    this.maxLogs = 1000;
    this.logs = [];
    this.originalLog = console.log;
    this.originalError = console.error;
    this.originalWarn = console.warn;
    this.captureConsole();
  }

  captureConsole(): void {
    // Intercepter console.log
    console.log = (...args: any[]) => {
      this.originalLog.apply(console, args);
      this.addLog({
        level: 'info',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
      });
    };

    // Intercepter console.error
    console.error = (...args: any[]) => {
      this.originalError.apply(console, args);
      this.addLog({
        level: 'error',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
      });
    };

    // Intercepter console.warn
    console.warn = (...args: any[]) => {
      this.originalWarn.apply(console, args);
      this.addLog({
        level: 'warn',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
      });
    };
  }

  addLog(logEntry: Omit<LogEntry, 'timestamp' | 'iso'>): void {
    const log: LogEntry = {
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      ...logEntry,
    };

    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notifier les subscribers
    this.notifySubscribers(log);
  }

  subscribe(callback: (log: LogEntry) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(log: LogEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(log);
      } catch (error) {
        this.originalError('Error in log subscriber:', error);
      }
    });
  }

  getLogs(limit = 50, filter: { level?: string; search?: string } | null = null): LogEntry[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(log => log.level === filter.level);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(log => 
          log.message.toLowerCase().includes(searchLower)
        );
      }
    }

    return filtered.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStats(): { total: number; info: number; warn: number; error: number } {
    const stats = {
      total: this.logs.length,
      info: this.logs.filter(l => l.level === 'info').length,
      warn: this.logs.filter(l => l.level === 'warn').length,
      error: this.logs.filter(l => l.level === 'error').length,
    };
    return stats;
  }

  restore(): void {
    console.log = this.originalLog;
    console.error = this.originalError;
    console.warn = this.originalWarn;
  }
}