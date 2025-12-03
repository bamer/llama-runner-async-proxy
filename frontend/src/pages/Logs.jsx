import React, { useEffect, useState, useRef } from 'react';
import { useLogsStore } from '../store';

const LogsPage = () => {
  const logs = useLogsStore((state) => state.logs);
  const stats = useLogsStore((state) => state.stats);
  const filter = useLogsStore((state) => state.filter);
  const setFilter = useLogsStore((state) => state.setFilter);
  const clearLogs = useLogsStore((state) => state.clearLogs);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);

  const filteredLogs = logs.filter((log) => {
    if (filter.level && log.level !== filter.level) return false;
    if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return '#ef4444';
      case 'warn':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getLevelBgColor = (level) => {
    switch (level) {
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      case 'warn':
        return 'rgba(245, 158, 11, 0.1)';
      case 'info':
        return 'rgba(59, 130, 246, 0.1)';
      default:
        return 'rgba(107, 114, 128, 0.1)';
    }
  };

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>📋 Application Logs</h2>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Total</span>
            <span style={styles.statValue}>{stats.total}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Info</span>
            <span style={{ ...styles.statValue, color: '#3b82f6' }}>{stats.info}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Warn</span>
            <span style={{ ...styles.statValue, color: '#f59e0b' }}>{stats.warn}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Error</span>
            <span style={{ ...styles.statValue, color: '#ef4444' }}>{stats.error}</span>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.filterGroup}>
          <label>Filter by Level:</label>
          <select value={filter.level || ''} onChange={(e) => setFilter({ level: e.target.value || null })} style={styles.select}>
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label>Search:</label>
          <input type="text" value={filter.search} onChange={(e) => setFilter({ search: e.target.value })} placeholder="Search logs..." style={styles.input} />
        </div>
        <div style={styles.filterGroup}>
          <label>
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} style={{ marginRight: '0.5rem' }} />
            Auto Scroll
          </label>
        </div>
        <button onClick={clearLogs} style={{...styles.btn, ...styles.btnDanger}}>
          🗑️ Clear Logs
        </button>
      </div>

      <div style={styles.logsContainer}>
        {filteredLogs.length === 0 ? (
          <div style={styles.empty}>
            <p>No logs to display</p>
          </div>
        ) : (
          <div>
            {filteredLogs.map((log, idx) => (
              <div key={idx} style={{...styles.logEntry, backgroundColor: getLevelBgColor(log.level), borderLeft: `3px solid ${getLevelColor(log.level)}`}}>
                <div style={styles.logHeader}>
                  <span style={{...styles.logLevel, color: getLevelColor(log.level)}}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={styles.logMessage}>{log.message}</div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' },
  stats: { display: 'flex', gap: '2rem' },
  statItem: { textAlign: 'center' },
  statLabel: { display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' },
  statValue: { display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' },
  controls: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  select: { padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem' },
  input: { padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' },
  btn: { padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnDanger: { backgroundColor: 'var(--color-danger)', color: 'white' },
  logsContainer: { backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem' },
  logEntry: { padding: '0.75rem', borderRadius: '0.25rem' },
  logHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' },
  logLevel: { fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' },
  logTime: { fontSize: '0.7rem', color: 'var(--text-tertiary)' },
  logMessage: { color: 'var(--text-primary)', wordBreak: 'break-word' },
  empty: { textAlign: 'center', color: 'var(--text-tertiary)', padding: '3rem' },
};

export default LogsPage;
