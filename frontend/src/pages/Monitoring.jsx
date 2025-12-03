import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import io from 'socket.io-client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const MonitoringPage = () => {
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [systemHistory, setSystemHistory] = useState([]);
  const [runningModels, setRunningModels] = useState({});
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [modelHistory, setModelHistory] = useState([]);
  const [cpuChart, setCpuChart] = useState(null);
  const [memoryChart, setMemoryChart] = useState(null);
  const [tokenSpeedChart, setTokenSpeedChart] = useState(null);
  const [contextChart, setContextChart] = useState(null);
  const [slotsChart, setSlotsChart] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const MAX_HISTORY = 120;
  const CHART_DISPLAY_POINTS = 60;

  useEffect(() => {
    const newSocket = io(window.location.origin);
    newSocket.on('connect', () => {
      setConnected(true);
    });
    newSocket.on('disconnect', () => {
      setConnected(false);
    });
    newSocket.on('metrics:update', (data) => {
      setSystemMetrics(data);
      setSystemHistory(prev => [...prev.slice(-MAX_HISTORY + 1), data]);
    });
    newSocket.on('llama-metrics:update', (data) => {
      const { modelName, metrics, history } = data;
      setRunningModels(prev => ({ ...prev, [modelName]: { ...metrics, lastUpdate: new Date() } }));
      if (selectedModel === modelName) {
        setModelMetrics(metrics);
        setModelHistory(history || []);
      }
    });
    newSocket.on('model:status', (data) => {
      const { modelName, status } = data;
      if (status === 'stopped') {
        setRunningModels(prev => {
          const updated = { ...prev };
          delete updated[modelName];
          return updated;
        });
        if (selectedModel === modelName) {
          setSelectedModel(null);
          setModelMetrics(null);
          setModelHistory([]);
        }
      }
    });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [selectedModel]);

  useEffect(() => {
    if (!systemHistory || systemHistory.length === 0) return;
    const displayData = systemHistory.slice(-CHART_DISPLAY_POINTS);
    const labels = displayData.map((_, i) => i + 's');
    setCpuChart({
      labels,
      datasets: [{
        label: 'CPU %',
        data: displayData.map(m => m.cpu?.percent || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      }],
    });
  }, [systemHistory]);

  useEffect(() => {
    if (!systemHistory || systemHistory.length === 0) return;
    const displayData = systemHistory.slice(-CHART_DISPLAY_POINTS);
    const labels = displayData.map((_, i) => i + 's');
    setMemoryChart({
      labels,
      datasets: [{
        label: 'Memory (GB)',
        data: displayData.map(m => (m.memory?.used || 0) / 1024 / 1024 / 1024),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      }],
    });
  }, [systemHistory]);

  useEffect(() => {
    if (!modelHistory || modelHistory.length === 0) return;
    const displayData = modelHistory.slice(-CHART_DISPLAY_POINTS);
    const labels = displayData.map((_, i) => i + 's');
    const tokenSpeeds = [];
    for (let i = 0; i < displayData.length; i++) {
      if (i === 0) tokenSpeeds.push(0);
      else {
        const diff = displayData[i].llama?.tokensGenerated - displayData[i - 1].llama?.tokensGenerated;
        tokenSpeeds.push(Math.max(0, diff || 0));
      }
    }
    setTokenSpeedChart({
      labels,
      datasets: [{
        label: 'Tokens/sec',
        data: tokenSpeeds,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      }],
    });
  }, [modelHistory]);

  useEffect(() => {
    if (!modelHistory || modelHistory.length === 0) return;
    const displayData = modelHistory.slice(-CHART_DISPLAY_POINTS);
    const labels = displayData.map((_, i) => i + 's');
    setContextChart({
      labels,
      datasets: [{
        label: 'Context Used',
        data: displayData.map(m => m.llama?.contextUsed || 0),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      }],
    });
  }, [modelHistory]);

  useEffect(() => {
    if (!modelHistory || modelHistory.length === 0) return;
    const displayData = modelHistory.slice(-CHART_DISPLAY_POINTS);
    const labels = displayData.map((_, i) => i + 's');
    setSlotsChart({
      labels,
      datasets: [
        {
          label: 'Busy',
          data: displayData.map(m => m.slots?.busy || 0),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
        },
        {
          label: 'Idle',
          data: displayData.map(m => m.slots?.idle || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
        },
      ],
    });
  }, [modelHistory]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top' } },
    scales: {
      y: { beginAtZero: true, ticks: { color: 'var(--text-secondary)' } },
      x: { ticks: { color: 'var(--text-secondary)' } },
    },
  };

  return (
    <div style={styles.container}>
      <h2>📊 Real-time Monitoring</h2>
      <div style={{...styles.statusBar, backgroundColor: connected ? '#10b981' : '#ef4444'}}>
        <span>{connected ? '🟢 Connected' : '🔴 Disconnected'}</span>
      </div>

      <div style={styles.modelSelector}>
        <h3>Running Models ({Object.keys(runningModels).length})</h3>
        <div style={styles.modelList}>
          {Object.keys(runningModels).length === 0 ? (
            <p style={styles.noModels}>No models running</p>
          ) : (
            Object.entries(runningModels).map(([name, metrics]) => (
              <div key={name} style={{...styles.modelCard, backgroundColor: selectedModel === name ? 'var(--color-primary)' : 'var(--bg-tertiary)', cursor: 'pointer'}} onClick={() => setSelectedModel(name)}>
                <strong>{name}</strong>
                {metrics.llama && <p>Tokens: {metrics.llama.tokensGenerated || 0} | Context: {metrics.llama.contextUsed || 0}/{metrics.llama.contextSize || 0}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h3>System Metrics</h3>
        <div style={styles.chartsGrid}>
          {cpuChart && <div style={styles.chartContainer}><h4>CPU</h4><Line data={cpuChart} options={chartOptions} height={200} /></div>}
          {memoryChart && <div style={styles.chartContainer}><h4>Memory</h4><Line data={memoryChart} options={chartOptions} height={200} /></div>}
        </div>
      </div>

      {selectedModel && modelMetrics && (
        <div style={styles.section}>
          <h3>Model: {selectedModel}</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}><div style={styles.statLabel}>Tokens</div><div style={styles.statValue}>{modelMetrics.llama?.tokensGenerated || 0}</div></div>
            <div style={styles.statCard}><div style={styles.statLabel}>Speed</div><div style={styles.statValue}>{modelHistory.length >= 2 ? (modelHistory[modelHistory.length - 1].llama?.tokensGenerated - modelHistory[modelHistory.length - 2].llama?.tokensGenerated).toFixed(1) : '0'} tok/s</div></div>
            <div style={styles.statCard}><div style={styles.statLabel}>Context</div><div style={styles.statValue}>{modelMetrics.llama?.contextUsedPercent || 0}%</div></div>
          </div>
          <div style={styles.chartsGrid}>
            {tokenSpeedChart && <div style={styles.chartContainer}><h4>Speed</h4><Line data={tokenSpeedChart} options={chartOptions} height={200} /></div>}
            {contextChart && <div style={styles.chartContainer}><h4>Context</h4><Line data={contextChart} options={chartOptions} height={200} /></div>}
            {slotsChart && <div style={styles.chartContainer}><h4>Slots</h4><Bar data={slotsChart} options={chartOptions} height={200} /></div>}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '2rem', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  statusBar: { padding: '1rem', borderRadius: '0.5rem', color: 'white', marginBottom: '2rem' },
  modelSelector: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem' },
  modelList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' },
  modelCard: { padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' },
  noModels: { color: 'var(--text-tertiary)' },
  section: { marginBottom: '2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  statCard: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' },
  statLabel: { fontSize: '0.75rem', color: 'var(--text-secondary)' },
  statValue: { fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' },
  chartContainer: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem', height: '350px' },
};

export default MonitoringPage;
