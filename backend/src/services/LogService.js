/**
 * Service pour capturer et streamer les logs en temps réel
 */
class LogService {
  constructor() {
    this.subscribers = new Set();
    this.maxLogs = 1000;
    this.logs = [];
    this.originalLog = console.log;
    this.originalError = console.error;
    this.originalWarn = console.warn;
    this.captureConsole();
  }

  captureConsole() {
    // Intercepter console.log
    console.log = (...args) => {
      this.originalLog.apply(console, args);
      this.addLog({
        level: 'info',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
      });
    };

    // Intercepter console.error
    console.error = (...args) => {
      this.originalError.apply(console, args);
      this.addLog({
        level: 'error',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
      });
    };

    // Intercepter console.warn
    console.warn = (...args) => {
      this.originalWarn.apply(console, args);
      this.addLog({
        level: 'warn',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
      });
    };
  }

  addLog(logEntry) {
    const log = {
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

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(log) {
    this.subscribers.forEach(callback => {
      try {
        callback(log);
      } catch (error) {
        this.originalError('Error in log subscriber:', error);
      }
    });
  }

  getLogs(limit = 50, filter = null) {
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

  clearLogs() {
    this.logs = [];
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      info: this.logs.filter(l => l.level === 'info').length,
      warn: this.logs.filter(l => l.level === 'warn').length,
      error: this.logs.filter(l => l.level === 'error').length,
    };
    return stats;
  }

  restore() {
    console.log = this.originalLog;
    console.error = this.originalError;
    console.warn = this.originalWarn;
  }
}

module.exports = LogService;
