import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterText, setFilterText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const logsEndRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/v1/logs?limit=500');
      setLogs(res.data.logs || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(loadLogs, 3000);
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || 
      log.toLowerCase().includes(filterLevel.toUpperCase());
    const matchesText = filterText === '' || 
      log.toLowerCase().includes(filterText.toLowerCase());
    return matchesLevel && matchesText;
  });

  const downloadLogs = () => {
    const content = logs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📋 System Logs</h2>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Filter logs..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={styles.input}
        />
        
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          style={styles.select}
        >
          <option value="all">All Levels</option>
          <option value="error">Error</option>
          <option value="warn">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>

        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (3s)
        </label>

        <button
          onClick={loadLogs}
          disabled={isLoading}
          style={{ ...styles.btn, ...styles.btnPrimary }}
        >
          🔄 Refresh
        </button>
        
        <button
          onClick={downloadLogs}
          style={{ ...styles.btn, ...styles.btnSuccess }}
        >
          ⬇️ Download
        </button>

        <button
          onClick={() => setLogs([])}
          style={{ ...styles.btn, ...styles.btnDanger }}
        >
          🗑️ Clear
        </button>
      </div>

      <div style={styles.logsContainer}>
        {isLoading && <p style={styles.loading}>Loading logs...</p>}
        {filteredLogs.length === 0 ? (
          <p style={styles.empty}>No logs to display</p>
        ) : (
          filteredLogs.map((log, idx) => {
            const isError = log.includes('error') || log.includes('ERROR') || log.includes('❌');
            const isWarn = log.includes('warn') || log.includes('WARN') || log.includes('⚠️');
            const isDebug = log.includes('debug') || log.includes('DEBUG') || log.includes('🔍');
            
            return (
              <div
                key={idx}
                style={{
                  ...styles.logLine,
                  borderLeftColor: isError ? '#ef4444' : isWarn ? '#f59e0b' : '#3b82f6',
                }}
              >
                <span style={styles.logBullet}>
                  {isError ? '❌' : isWarn ? '⚠️' : isDebug ? '🔍' : 'ℹ️'}
                </span>
                <code style={styles.logText}>{log}</code>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      <div style={styles.footer}>
        Showing {filteredLogs.length} of {logs.length} logs
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' },
  title: { marginBottom: '1rem' },
  controls: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' },
  input: { padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem', flex: '1', minWidth: '150px' },
  select: { padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' },
  btn: { padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', whiteSpace: 'nowrap' },
  btnPrimary: { backgroundColor: 'var(--color-primary)', color: 'white' },
  btnSuccess: { backgroundColor: 'var(--color-success)', color: 'white' },
  btnDanger: { backgroundColor: 'var(--color-danger)', color: 'white' },
  logsContainer: { flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem' },
  logLine: { display: 'flex', gap: '0.75rem', padding: '0.5rem', borderLeft: '3px solid', marginBottom: '0.25rem', color: 'var(--text-secondary)', alignItems: 'flex-start' },
  logBullet: { minWidth: '1.5rem', marginTop: '0.125rem' },
  logText: { flex: 1, wordBreak: 'break-all', color: 'var(--text-primary)' },
  loading: { color: 'var(--color-primary)', textAlign: 'center', padding: '1rem' },
  empty: { color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' },
  footer: { marginTop: '1rem', padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-tertiary)', textAlign: 'right' },
};

export default LogsPage;
